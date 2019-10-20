const express = require('express');
const app = express();

const { Datastore } = require('@google-cloud/datastore');
const bodyParser = require('body-parser');
const url = require('url');

const datastore = new Datastore();

// const LODGING = "Lodging";

const router = express.Router();

app.use(bodyParser.json());

function fromDatastore(item) {
  item.id = item[Datastore.KEY].id;
  return item;
}

/* ------------- Begin Lodging Model Functions ------------- */
async function post_boat(name, type, length) {
  var key = datastore.key("Boat");
  const new_boat = { "name": name, "type": type, "length": length };

  try {
    await datastore.save({ "key": key, "data": new_boat });
    return key;
  } catch (error) {
    throw error;
  }
}

async function get_boats() {
  const query = datastore.createQuery("Boat");
  try {
    let entities = await datastore.runQuery(query)
    return entities[0].map(fromDatastore);
  } catch (error) {
    throw error;
  }
}

async function get_boat(id) {
  try {
    const key = datastore.key(["Boat", parseInt(id, 10)]);
    let boat = await datastore.get(key);
    return boat;
  } catch (error) {
    throw error;
  }
}

async function edit_boat(id, name, type, length) {
  const key = datastore.key(["Boat", parseInt(id, 10)]);
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
  if (!id_as_int || isNaN(id_as_int)) return true;
  const key = datastore.key(["Boat", parseInt(id, 10)]);
  if (!key) return true;
  let boats = await datastore.get(key);
  if (!boats || !boats[0]) return false;

  try {
    await datastore.delete(key);
    return true;
  } catch (error) {
    throw error;
  }
}

/* ------------- End Model Functions ------------- */

/* ------------- Begin Controller Functions ------------- */

router.get('/boats', async function (req, res) {
  try {
    let boats = await get_boats();
    res.status(200).json(boats);
  } catch (error) {
    res.status(500).send();
    console.error(error);
  }
});

router.get('/boats/:boat_id', async function (req, res) {
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
      res.status(200).json(boat);
    }
    else res.status(404).send({
      "Error": "No boat with this boat_id exists"
    });
  } catch (error) {
    res.status(500).send();
    console.error(error);
  }
});

router.post('/boats', async function (req, res) {
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
          pathname: req.originalUrl + key.id
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

router.patch('/boats/:boat_id', async function (req, res) {
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
        })
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

router.delete('/boats/:boat_id', async function (req, res) {
  try {
    let result = await delete_boat(req.params.boat_id);
    if (result) {
      res.status(204).end();
    } else {
      res.status(404).end();
    }
  } catch (error) {
    res.status(500).end();
    console.log(error);
  }
});

/* ------------- End Controller Functions ------------- */

app.use('/', router);

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});