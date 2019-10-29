const express = require('express');
const app = express();

const { Datastore } = require('@google-cloud/datastore');
const bodyParser = require('body-parser');
const url = require('url');

const datastore = new Datastore();

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

async function post_slip(number) {
  let key = datastore.key("Slip");
  const new_slip = {
    "number": number,
    "current_boat": null
  };
  try {
    await datastore.save({
      "key": key,
      "data": new_slip
    });
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

async function get_slips() {
  const query = datastore.createQuery("Slip");
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

async function get_slip(id) {
  try {
    const key = datastore.key(["Slip", parseInt(id, 10)]);
    let slip = await datastore.get(key);
    return slip;
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

async function put_boat_in_slip(boat_id, slip_id) {
  const boat_key = datastore.key(["Boat", parseInt(boat_id, 10)]);
  const slip_key = datastore.key(["Slip", parseInt(slip_id, 10)]);

  let boats = await datastore.get(boat_key);
  if (!boats || !boats[0]) return 404;
  let slips = await datastore.get(slip_key);
  if (!slips || !slips[0]) return 404;

  let slip = slips[0];
  if (slip.current_boat) return 403;
  slip.current_boat = boat_id;
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

async function remove_boat_from_slip(boat_id, slip_id) {
  const boat_key = datastore.key(["Boat", parseInt(boat_id, 10)]);
  const slip_key = datastore.key(["Slip", parseInt(slip_id, 10)]);

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

async function delete_boat(id) {
  let id_as_int = parseInt(id, 10);
  if (!id_as_int || isNaN(id_as_int)) return false;

  const boat_key = datastore.key(["Boat", parseInt(id, 10)]);
  let boats = await datastore.get(boat_key);
  if (!boats || !boats[0]) return false;

  const slip_query = datastore.createQuery("Slip");
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

async function delete_slip(id) {
  let id_as_int = parseInt(id, 10);
  if (!id_as_int || isNaN(id_as_int)) return false;
  const key = datastore.key(["Slip", parseInt(id, 10)]);

  let slips = await datastore.get(key);
  if (!slips || !slips[0]) return false;

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
    for (let i = 0; i < boats.length; i++) {
      boats[i].self = url.format({
        protocol: 'https',
        hostname: req.get('host'),
        pathname: req.originalUrl + '/' + boats[i].id
      });
    } // todo: move this up to the model function
    res.status(200).json(boats);
  } catch (error) {
    res.status(500).send();
    console.error(error);
  }
});

router.get('/slips', async function (req, res) {
  try {
    let slips = await get_slips();
    for (let i = 0; i < slips.length; i++) {
      slips[i].self = url.format({
        protocol: 'https',
        hostname: req.get('host'),
        pathname: req.originalUrl + '/' + slips[i].id
      });
    }
    res.status(200).json(slips);
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

router.get('/slips/:slip_id', async function (req, res) {
  try {
    let slip_id = req.params.slip_id;
    let slips = await get_slip(slip_id);
    if (slips && slips[0]) {
      let slip = slips[0];
      slip.id = slip_id;
      slip.self = url.format({
        protocol: 'https',
        hostname: req.get('host'),
        pathname: req.originalUrl
      });
      res.status(200).json(slip);
    }
    else {
      res.status(404).send({
        "Error": "No slip with this slip_id exists"
      });
    }
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

router.post('/slips', async function (req, res) {
  let slip_number = req.body.number;
  if (slip_number) {
    try {
      let key = await post_slip(slip_number);
      res.status(201).send({
        "id": key.id,
        "number": slip_number,
        "current_boat": null,
        "self": url.format({
          protocol: 'https',
          hostname: req.get('host'),
          pathname: req.originalUrl + '/' + key.id
        })
      });
    } catch (err) {
      res.status(500).send();
      console.error(err);
    }
  } else {
    res.status(400).send({
      "Error": "The request object is missing the required number"
    });
  }
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

router.put('/slips/:slip_id/:boat_id', async function (req, res) {
  let boat_id = req.params.boat_id;
  let slip_id = req.params.slip_id;
  try {
    let statusCode = await put_boat_in_slip(boat_id, slip_id);
    res.status(statusCode);
    switch (statusCode) {
      case 403:
        res.send({
          "Error": "The slip is not empty"
        });
        break;
      case 404:
        res.send({
          "Error": "The specified boat and/or slip don\u2019t exist"
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

router.delete('/slips/:slip_id/:boat_id', async function (req, res) {
  let boat_id = req.params.boat_id;
  let slip_id = req.params.slip_id;
  try {
    let statusCode = await remove_boat_from_slip(boat_id, slip_id);
    res.status(statusCode);
    switch (statusCode) {
      case 404:
        res.send({
          "Error": "No boat with this boat_id is at the slip with this slip_id"
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

router.delete('/boats/:boat_id', async function (req, res) {
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

router.delete('/slips/:slip_id', async function (req, res) {
  try {
    let result = await delete_slip(req.params.slip_id);
    if (result) {
      res.status(204).end();
    } else {
      res.status(404).send({
        "Error": "No slip with this slip_id exists"
      });
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