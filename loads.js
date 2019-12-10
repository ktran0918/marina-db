const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const ds = require('./datastore');
const url = require('url');

const { Datastore } = require('@google-cloud/datastore');

const datastore = ds.datastore;

const BOAT = "Boat";
const LOAD = "Load";

router.use(bodyParser.json());

/* ------------- Begin guest Model Functions ------------- */
async function post_load(weight, content, delivery_date) {
  var key = datastore.key(LOAD);
  const new_load = {
    "weight": weight,
    "carrier": {},
    "content": content,
    "delivery_date": delivery_date,
  };
  try {
    await datastore.save({ "key": key, "data": new_load });
    return key;
  } catch (error) {
    throw error;
  }
}

async function get_loads(req) {
  let totalQuery = datastore.createQuery(LOAD);
  let query = datastore.createQuery(LOAD).limit(5);
  let results = {};
  if (Object.keys(req.query).includes('cursor')) {
    query = query.start(req.query.cursor);
  }
  try {
    let totalEntities = await datastore.runQuery(totalQuery);
    let entities = await datastore.runQuery(query);
    results.items = entities[0].map(ds.fromDatastore);
    results.totalCount = totalEntities[0].length;

    if (entities[1].moreResults !== ds.Datastore.NO_MORE_RESULTS) {
      results.next = "https://" + req.get("host") + req.baseUrl + "?cursor=" + entities[1].endCursor;
    }
    return results;
  } catch (error) {
    throw error;
  }
}

async function get_load(id) {
  try {
    const key = datastore.key([LOAD, parseInt(id, 10)]);
    let load = await datastore.get(key);
    return load;
  } catch (error) {
    throw error;
  }
}

async function delete_load(id) {
  let id_as_int = parseInt(id, 10);
  if (!id_as_int || isNaN(id_as_int)) return false;

  const load_key = datastore.key([LOAD, parseInt(id, 10)]);
  let loads = await datastore.get(load_key);
  if (!loads || !loads[0]) return false;

  let load = loads[0];
  if (load.carrier.id) {
    const boat_key = datastore.key([BOAT, parseInt(load.carrier.id, 10)]);
    let boats = await datastore.get(boat_key);
    let boat = boats[0];
    let new_load = boat.loads.filter(boat_load => boat_load.id != id);
    boat.loads = new_load;
    try {
      await datastore.save({
        "key": boat_key,
        "data": boat
      });
    } catch (error) {
      throw error;
    }
  }

  try {
    await datastore.delete(load_key);
    return true;
  } catch (error) {
    throw error;
  }
}

/* ------------- End Model Functions ------------- */

/* ------------- Begin Controller Functions ------------- */
router.post('/', async function (req, res) {
  const accepts = req.accepts(['application/json']);
  if (!accepts) {
    res.status(406).send({
      "Error": "The requested content type is not available"
    });
    return;
  }

  let weight = req.body.weight;
  let content = req.body.content;
  let delivery_date = req.body.delivery_date;

  if (weight && content && delivery_date) {
    try {
      let key = await post_load(weight, content, delivery_date);
      res.status(201).send({
        "id": key.id,
        "weight": weight,
        "carrier": {},
        "content": content,
        "delivery_date": delivery_date,
        "self": url.format({
          protocol: 'https',
          hostname: req.get('host'),
          pathname: req.baseUrl + '/' + key.id
        })
      });
    } catch (error) {
      res.status(500).send();
      console.error(error);
    }
  } else res.status(400).send({
    "Error": "The request object is missing at least one of the required attributes"
  });
});

router.get('/:load_id', async function (req, res) {
  const accepts = req.accepts(['application/json']);
  if (!accepts) {
    res.status(406).send({
      "Error": "The requested content type is not available"
    });
    return;
  }

  try {
    let load_id = req.params.load_id;
    let loads = await get_load(load_id);
    if (loads && loads[0]) {
      let load = loads[0];
      load.id = load_id;
      load.self = url.format({
        protocol: 'https',
        hostname: req.get('host'),
        pathname: req.baseUrl + '/' + load_id
      });

      if (Object.keys(load.carrier).length > 0) {
        load.carrier.self = url.format({
          protocol: 'https',
          hostname: req.get('host'),
          pathname: 'boats/' + load.carrier.id
        });
      }

      res.status(200).json(load);
    }
    else {
      res.status(404).send({
        "Error": "No load with this load_id exists"
      });
    }
  } catch (error) {
    res.status(500).send();
    console.error(error);
  }
});

router.get('/', async function (req, res) {
  const accepts = req.accepts(['application/json']);
  if (!accepts) {
    res.status(406).send({
      "Error": "The requested content type is not available"
    });
    return;
  }

  try {
    let results = await get_loads(req);
    let loads = results.items;
    for (let i = 0; i < loads.length; i++) {
      let load = loads[i];
      load.self = url.format({
        protocol: 'https',
        hostname: req.get('host'),
        pathname: req.baseUrl + '/' + load.id
      });

      if (Object.keys(load.carrier).length > 0) {
        load.carrier.self = url.format({
          protocol: 'https',
          hostname: req.get('host'),
          pathname: 'boats/' + load.carrier.id
        });
      }
    }
    res.status(200).json(results);
  } catch (error) {
    res.status(500).send();
    console.error(error);
  }
});

router.delete('/:load_id', async function (req, res) {
  try {
    let result = await delete_load(req.params.load_id);
    if (result) {
      res.status(204).end();
    } else {
      res.status(404).send({
        "Error": "No load with this load_id exists"
      });
    }
  } catch (error) {
    res.status(500).end();
    console.log(error);
  }
});

/* ------------- End Controller Functions ------------- */

module.exports = router;