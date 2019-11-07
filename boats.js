const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const jsonToHtml = require('json-to-html');
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
  if (!(await name_is_unique(name))) {
    return {
      statusCode: 403,
      message: 'A boat of the same name already exists'
    }
  }

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
    let boats = await datastore.get(key);
    if (boats && boats[0]) {
      return boats[0];
    }
  } catch (error) {
    throw error;
  }
}

async function get_boat_loads(boat_id) {
  try {
    const key = datastore.key([BOAT, parseInt(boat_id, 10)]);
    let boats = await datastore.get(key);
    if (boats[0]) return boats[0].loads;
    else return null;
  } catch (error) {
    throw error;
  }
}

async function name_is_unique(name, id) {
  let query = datastore.createQuery(BOAT);
  let entities = await datastore.runQuery(query);
  let boats = entities[0];

  let existing_name = boats.find(boat => {
    if (boat.name == name && id != boat[Datastore.KEY].id) {
      return true;
    };
  });
  return existing_name ? false : true;
}

async function edit_boat(id, name, type, length) {
  const key = datastore.key([BOAT, parseInt(id, 10)]);
  let boats = await datastore.get(key);
  if (!boats || !boats[0]) return null;

  if (name) {
    if (!(await name_is_unique(name, id))) {
      return {
        statusCode: 403,
        message: 'A boat of the same name already exists'
      }
    }
  }

  let boat = boats[0];
  boat.name = name || boat.name;
  boat.type = type || boat.type;
  boat.length = length || boat.length;
  try {
    await datastore.save({
      "key": key,
      "data": boat
    });
    return boat;
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

  let boat = boats[0];
  try {
    if (boat.loads) {
      for (let i = 0; i < boat.loads.length; i++) {
        let load_id = boat.loads[i].id;
        const load_key = datastore.key([LOAD, parseInt(load_id, 10)]);
        let loads = await datastore.get(load_key);
        let load = loads[0];
        load.carrier = {};
        await datastore.save({
          "key": load_key,
          "data": load
        });
      }
    }
  } catch (error) {
    throw error;
  }

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

  if (load.carrier.id) return 403;

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
  if (load.carrier.id != boat_id) return 404;

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
        pathname: req.baseUrl + '/' + boat.id
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
    let boat = await get_boat(boat_id);
    if (boat) {
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

      const accepts = req.accepts(['application/json', 'text/html']);
      if (!accepts) {
        res.status(406).send({
          "Error": "Content type not acceptable"
        });
      } else if (accepts == 'application/json') {
        res.status(200).json(boat);
      } else if (accepts == 'text/html') {
        res.status(200).send(jsonToHtml(boat));
      } else {
        res.status(500).send('Content type cannot be read for unknown reasons');
      }
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
    if (loads == null) res.status(404).send({
      "Error": "No boat with this boat_id exists"
    });
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
  let invalid_attributes = Object.keys(req.body).filter(attribute => {
    if (attribute != 'name' && attribute != 'type' && attribute != 'length') {
      return true;
    }
  });
  if (invalid_attributes.length > 0) {
    res.status(403).send({
      "Error": "The request object contains attributes other than name, type, and length"
    });
    return;
  }

  let name = req.body.name;
  let type = req.body.type;
  let length = req.body.length;

  if (req.get('content-type') != 'application/json') {
    res.status(415).send({
      "Error": "Server only accepts application/json data"
    });
    return;
  }

  if (name && type && length != undefined) {
    if (!name.match(/^[a-z0-9 \-]+$/i) || name.length > 20) {
      res.status(403).send({
        "Error": "The name is invalid"
      });
      return;
    }

    if (!type.match(/^[a-z0-9 \-]+$/i) || type.length > 20) {
      res.status(403).send({
        "Error": "The type is invalid"
      });
      return;
    }

    if (isNaN(length) || length > 1000 || length < 10) {
      res.status(403).send({
        "Error": "The length is invalid"
      });
      return;
    }

    try {
      let result = await post_boat(req.body.name, req.body.type, req.body.length);

      if (!result.statusCode) {
        let key = result;
        res.set('Content', 'application/json');
        res.status(201).send({
          "id": key.id,
          "name": name,
          "type": type,
          "length": length,
          "self": url.format({
            protocol: 'https',
            hostname: req.get('host'),
            pathname: req.baseUrl + '/' + key.id
          })
        });
      } else {
        res.status(result.statusCode).send({
          "Error": result.message
        });
      }
    } catch (error) {
      res.status(500).send();
      console.error(error);
    }
  } else res.status(400).send({
    "Error": "The request object is missing at least one of the required attributes"
  });
});

router.put('/', function (req, res) {
  res.set('Accept', 'GET, POST');
  res.status(405).end();
});

router.patch('/:boat_id', async function (req, res) {
  let invalid_attributes = Object.keys(req.body).filter(attribute => {
    if (attribute != 'name' && attribute != 'type' && attribute != 'length') {
      return true;
    }
  });
  if (invalid_attributes.length > 0) {
    res.status(403).send({
      "Error": "The request object contains attributes other than name, type, and length"
    });
  }

  let boat_id = req.params.boat_id;
  let name = req.body.name;
  let type = req.body.type;
  let length = req.body.length;

  if (name) {
    if (!name.match(/^[a-z0-9 \-]+$/i) || name.length > 20) {
      res.status(403).send({
        "Error": "The name is invalid"
      });
      return;
    }
  }
  if (type) {
    if (!type.match(/^[a-z0-9 \-]+$/i) || type.length > 20) {
      res.status(403).send({
        "Error": "The type is invalid"
      });
      return;
    }
  }

  if (length != undefined) {
    if (isNaN(length) || length > 1000 || length < 10) {
      res.status(403).send({
        "Error": "The length is invalid"
      });
      return;
    }
  }

  if (name || type || length != undefined) {
    try {
      let result = await edit_boat(boat_id, name, type, length);
      if (result) {
        if (!result.statusCode) {
          let boat = result;
          res.set('Content', 'application/json');
          res.status(200).send({
            "id": boat_id,
            "name": boat.name,
            "type": boat.type,
            "length": length,
            "self": url.format({
              protocol: 'https',
              hostname: req.get('host'),
              pathname: req.originalUrl
            })
          });
        } else {
          res.status(result.statusCode).send({
            "Error": result.message
          });
        }
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

router.put('/:boat_id', async function (req, res) {
  let invalid_attributes = Object.keys(req.body).filter(attribute => {
    if (attribute != 'name' && attribute != 'type' && attribute != 'length') {
      return true;
    }
  });
  if (invalid_attributes.length > 0) {
    res.status(403).send({
      "Error": "The request object contains attributes other than name, type, and length"
    });
  }

  let boat_id = req.params.boat_id;
  let name = req.body.name;
  let type = req.body.type;
  let length = req.body.length;

  if (name && type && length != undefined) {
    if (!name.match(/^[a-z0-9 \-]+$/i) || name.length > 20) {
      res.status(403).send({
        "Error": "The name is invalid"
      });
      return;
    }

    if (!type.match(/^[a-z0-9 \-]+$/i) || type.length > 20) {
      res.status(403).send({
        "Error": "The type is invalid"
      });
      return;
    }

    if (isNaN(length) || length > 1000 || length < 10) {
      res.status(403).send({
        "Error": "The length is invalid"
      });
      return;
    }

    try {
      let result = await edit_boat(boat_id, name, type, length)
      if (result) {
        if (!result.statusCode) {
          res.set('Content', 'application/json');
          res.setHeader('Location', url.format({
            protocol: 'https',
            hostname: req.get('host'),
            pathname: req.originalUrl
          }));
          res.status(303).send();
        } else {
          res.status(result.statusCode).send({
            "Error": result.message
          });
        }
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
      "Error": "The request object is missing all the required attributes: name, type, and length"
    });
  }
});

router.put('/:boat_id/loads/:load_id', async function (req, res) {
  let boat_id = req.params.boat_id;
  let load_id = req.params.load_id;
  try {
    let statusCode = await put_load_on_boat(load_id, boat_id);
    res.status(statusCode);
    switch (statusCode) {
      case 403:
        res.send({
          "Error": "The specified load is already assigned to a boat"
        });
        break;
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

router.delete('/', function (req, res) {
  res.set('Accept', 'GET, POST');
  res.status(405).end();
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
          "Error": "No boat with this boat_id carries the load with this load_id"
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