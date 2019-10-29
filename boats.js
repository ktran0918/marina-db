const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const ds = require('./datastore');
const url = require('url');

const { Datastore } = require('@google-cloud/datastore');

const datastore = ds.datastore;

const BOAT = "Boat";
const SLIP = "Slip";
const LOAD = "Load";

router.use(bodyParser.json());

/* ------------- Begin guest Model Functions ------------- */
async function post_boat(name, type, length) {
  var key = datastore.key(BOAT);
  const new_boat = {
    "name": name,
    "type": type,
    "length": length,
    "loads": []
  };
  try {
    await datastore.save({ "key": key, "data": new_boat });
    return key;
  } catch (error) {
    throw error;
  }
}

async function get_boats(req) {
  let query = datastore.createQuery(BOAT).limit(3);
  let results = {};
  if (Object.keys(req.query).includes('cursor')) {
    query = query.start(req.query.cursor);
  }
  try {
    let entities = await datastore.runQuery(query);
    results.items = entities[0].map(ds.fromDatastore);

    if (entities[1].moreResults !== ds.Datastore.NO_MORE_RESULTS) {
      results.next = "https://" + req.get("host") + req.baseUrl + "?cursor=" + entities[1].endCursor;
    }
    return results;
  } catch (error) {
    throw error;
  }
}

async function get_boat(id) {
  try {
    const key = datastore.key([BOAT, parseInt(id, 10)]);
    let boat = await datastore.get(key);
    return boat;
  } catch (error) {
    throw error;
  }
}

async function get_boat_loads(boat_id) {
  try {
    const key = datastore.key([BOAT, parseInt(boat_id, 10)]);
    let boat = await datastore.get(key);
    return boat[0].loads;
  } catch (error) {
    throw error;
  }
}

async function edit_boat(id, name, type, length) {
  const key = datastore.key([BOAT, parseInt(id, 10)]);
  let boats = await datastore.get(key);
  if (!boats || !boats[0]) return false;
  const boat = {
    "name": name,
    "type": type,
    "length": length
  };
  try {
    await datastore.save({
      "key": key,
      "data": boat
    });
    return true;
  } catch (error) {
    throw error;
  }
}

async function delete_boat(id) {
  let id_as_int = parseInt(id, 10);
  if (!id_as_int || isNaN(id_as_int)) return false;

  const boat_key = datastore.key([BOAT, parseInt(id, 10)]);
  let boats = await datastore.get(boat_key);
  if (!boats || !boats[0]) return false;

  const slip_query = datastore.createQuery(SLIP);
  try {
    let entities = await datastore.runQuery(slip_query);
    let slips = entities[0];
    for (let i = 0; i < slips.length; i++) {
      if (slips[i].current_boat == id) {
        await remove_boat_from_slip(id, slips[i][Datastore.KEY].id);
      }
    }
    await datastore.delete(boat_key);
    return true;
  } catch (error) {
    throw error;
  }
}

async function remove_boat_from_slip(boat_id, slip_id) {
  const boat_key = datastore.key([BOAT, parseInt(boat_id, 10)]);
  const slip_key = datastore.key([SLIP, parseInt(slip_id, 10)]);

  let boats = await datastore.get(boat_key);
  if (!boats || !boats[0]) return 404;
  let slips = await datastore.get(slip_key);
  if (!slips || !slips[0]) return 404;

  let slip = slips[0];
  if (slip.current_boat != boat_id) return 404;

  slip.current_boat = null;
  try {
    await datastore.save({
      "key": slip_key,
      "data": slip
    });
    return 204;
  } catch (error) {
    throw error;
  }
}

async function put_load_on_boat(load_id, boat_id) {
  const boat_key = datastore.key([BOAT, parseInt(boat_id, 10)]);
  const load_key = datastore.key([LOAD, parseInt(load_id, 10)]);

  let boats = await datastore.get(boat_key);
  if (!boats || !boats[0]) return 404;
  let loads = await datastore.get(load_key);
  if (!loads || !loads[0]) return 404;

  let boat = boats[0];
  let load = loads[0];

  boat.loads.push({
    id: load_id
  });

  load.carrier = {
    id: boat_id,
    name: boat.name
  }

  try {
    await datastore.save({
      "key": boat_key,
      "data": boat
    });
    await datastore.save({
      "key": load_key,
      "data": load
    })
    return 204;
  } catch (error) {
    throw error;
  }
}

async function remove_load_from_boat(load_id, boat_id) {
  const boat_key = datastore.key([BOAT, parseInt(boat_id, 10)]);
  const load_key = datastore.key([LOAD, parseInt(load_id, 10)]);

  let boats = await datastore.get(boat_key);
  if (!boats || !boats[0]) return 404;
  let loads = await datastore.get(load_key);
  if (!loads || !loads[0]) return 404;

  let load = loads[0];
  // if (load.carrier.id != boat_id) return 404;

  let boat = boats[0];
  let existing_load = boat.loads.find(
    boat_load => boat_load.id == load_id
  );

  load.carrier = {};
  if (existing_load) {
    let new_load = boat.loads.filter(
      boat_load => boat_load.id != load_id
    );
    boat.loads = new_load;
  }
  try {
    await datastore.save({
      "key": load_key,
      "data": load
    });
    await datastore.save({
      "key": boat_key,
      "data": boat
    });
    return 204;
  } catch (error) {
    throw error;
  }
}

/* ------------- End Model Functions ------------- */

/* ------------- Begin Controller Functions ------------- */
router.get('/', async function (req, res) {
  try {
    let results = await get_boats(req);
    let boats = results.items;
    for (let i = 0; i < boats.length; i++) {
      let boat = boats[i];
      boat.self = url.format({
        protocol: 'https',
        hostname: req.get('host'),
        pathname: req.originalUrl + '/' + boat.id
      });

      for (let i = 0; i < boat.loads.length; i++) {
        let load = boat.loads[i];
        load.self = url.format({
          protocol: 'https',
          hostname: req.get('host'),
          pathname: 'loads/' + load.id
        });
      }
    }
    res.status(200).json(results);
  } catch (error) {
    res.status(500).send();
    console.error(error);
  }
});

router.get('/:boat_id', async function (req, res) {
  try {
    let boat_id = req.params.boat_id;
    let boats = await get_boat(boat_id);
    if (boats && boats[0]) {
      let boat = boats[0];
      boat.id = boat_id;
      boat.self = url.format({
        protocol: 'https',
        hostname: req.get('host'),
        pathname: req.originalUrl
      });

      for (let i = 0; i < boat.loads.length; i++) {
        let load = boat.loads[i];
        load.self = url.format({
          protocol: 'https',
          hostname: req.get('host'),
          pathname: 'loads/' + load.id
        });
      }

      res.status(200).json(boat);
    }
    else {
      res.status(404).send({
        "Error": "No boat with this boat_id exists"
      });
    }
  } catch (error) {
    res.status(500).send();
    console.error(error);
  }
});

router.get('/:boat_id/loads', async function (req, res) {
  try {
    let boat_id = req.params.boat_id;
    let loads = await get_boat_loads(boat_id);
    for (let i = 0; i < loads.length; i++) {
      let load = loads[i];
      load.self = url.format({
        protocol: 'https',
        hostname: req.get('host'),
        pathname: 'loads/' + load.id
      });
    }
    res.status(200).json(loads);
  } catch (error) {
    res.status(500).end();
    console.error(error);
  }
});

router.post('/', async function (req, res) {
  let name = req.body.name;
  let type = req.body.type;
  let length = req.body.length;

  if (name && type && length) {
    try {
      let key = await post_boat(req.body.name, req.body.type, req.body.length);
      res.status(201).send({
        "id": key.id,
        "name": name,
        "type": type,
        "length": length,
        "self": url.format({
          protocol: 'https',
          hostname: req.get('host'),
          pathname: req.originalUrl + '/' + key.id
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

router.patch('/:boat_id', async function (req, res) {
  let boat_id = req.params.boat_id;
  let name = req.body.name;
  let type = req.body.type;
  let length = req.body.length;

  if (name && type && length) {
    try {
      let result = await edit_boat(boat_id, name, type, length)
      if (result) {
        res.status(200).send({
          "id": boat_id,
          "name": name,
          "type": type,
          "length": length,
          "self": url.format({
            protocol: 'https',
            hostname: req.get('host'),
            pathname: req.originalUrl
          })
        });
      } else {
        res.status(404).send({
          "Error": "No boat with this boat_id exists"
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).send();
    }
  } else {
    res.status(400).send({
      "Error": "The request object is missing at least one of the required attributes"
    })
  }
});

router.put('/:boat_id/loads/:load_id', async function (req, res) {
  let boat_id = req.params.boat_id;
  let load_id = req.params.load_id;
  try {
    let statusCode = await put_load_on_boat(load_id, boat_id);
    res.status(statusCode);
    switch (statusCode) {
      case 404:
        res.send({
          "Error": "The specified boat and/or load don\u2019t exist"
        });
        break;
      default:
        res.send();
    }
  } catch (error) {
    res.status(500).end();
    console.error(error);
  }
});

router.delete('/:boat_id/loads/:load_id', async function (req, res) {
  let boat_id = req.params.boat_id;
  let load_id = req.params.load_id;
  try {
    let statusCode = await remove_load_from_boat(load_id, boat_id);
    res.status(statusCode);
    switch (statusCode) {
      case 404:
        res.send({
          "Error": "No boat with this boat_id is at the slip with this load_id"
        });
        break;
      default:
        res.send();
    }
  } catch (error) {
    res.status(500).end();
    console.error(error);
  }
});

router.delete('/:boat_id', async function (req, res) {
  try {
    let result = await delete_boat(req.params.boat_id);
    if (result) {
      res.status(204).end();
    } else {
      res.status(404).send({
        "Error": "No boat with this boat_id exists"
      });
    }
  } catch (error) {
    res.status(500).end();
    console.log(error);
  }
});

/* ------------- End Controller Functions ------------- */

module.exports = router;