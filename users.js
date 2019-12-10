const express = require('express');
const bodyParser = require('body-parser');
const { Datastore } = require('@google-cloud/datastore');
const url = require('url');

const oauth = require('./oauth');
const ds = require('./datastore');

const datastore = ds.datastore;

const USER = 'User';
const BOAT = "Boat";

const router = express.Router();
router.use(bodyParser.json());


// async function get_users(req) {
//   let query = datastore.createQuery(USER).limit(5);
//   let results = {};
//   if (Object.keys(req.query).includes('cursor')) {
//     query = query.start(req.query.cursor);
//   }
//   try {
//     let entities = await datastore.runQuery(query);
//     results.items = entities[0].map(ds.fromDatastore);

//     if (entities[1].moreResults !== ds.Datastore.NO_MORE_RESULTS) {
//       results.next = "https://" + req.get("host") + req.baseUrl + "?cursor=" + entities[1].endCursor;
//     }
//     return results;
//   } catch (error) {
//     throw error;
//   }
// }

async function get_user_boats(req) {
  let query = datastore.createQuery(BOAT);
  // let results = {};
  // if (Object.keys(req.query).includes('cursor')) {
  //   query = query.start(req.query.cursor);
  // }
  try {
    let entities = await datastore.runQuery(query);
    let results = entities[0].map(ds.fromDatastore);

    // if (entities[1].moreResults !== ds.Datastore.NO_MORE_RESULTS) {
    //   results.next = "https://" + req.get("host") + req.baseUrl + "?cursor=" + entities[1].endCursor;
    // }

    let user_boats = results.filter(boat => {
      if (boat.owner == req.params.user_id) {
        return true;
      }
    });

    return user_boats;
  } catch (error) {
    throw error;
  }
}


// router.get('/', async (req, res) => {
//   try {
//     let results = await get_users(req);
//     let users = results.items;
//     for (let i = 0; i < users.length; i++) {
//       let user = users[i];
//       user.self = url.format({
//         protocol: 'https',
//         hostname: req.get('host'),
//         pathname: req.baseUrl + '/' + user.id
//       });
//     }

//     res.status(200).json(results);
//   } catch (error) {
//     res.status(500).send();
//     console.error(error);
//   }
// });


router.get('/:user_id/boats', async (req, res) => {
  let userid;
  try {
    const accepts = req.accepts(['application/json']);
    if (!accepts) {
      res.status(406).send({
        "Error": "The requested content type is not available"
      });
      return;
      // } else if (accepts == 'application/json') {
      //   res.status(200).json(boat);
      // } else if (accepts == 'text/html') {
      //   res.status(200).send(jsonToHtml(boat));
    }
    // else {
    //   res.status(500).send('Content type cannot be read for unknown reasons');
    // }
  } catch (error) {
    res.status(500).send('Content type cannot be read for unknown reasons');
    console.error(error);
    return;
  }

  try {
    let jwt = req.headers.authorization.split(' ')[1];
    userid = await oauth.verify(jwt);
    if (userid != req.params.user_id) {
      throw new Error(`user_id provided does not match the user_id in JWT`);
    }
  } catch (err) {
    res.status(401).send({
      "Error": "Not authorized to view boats not owned by the user"
    });
    console.error(err);
    return;
  }

  try {
    let user_boats = await get_user_boats(req, userid);
    res.status(200).json(user_boats);
  } catch (err) {
    res.status(500).end();
    console.error(err);
  }
})


module.exports = router;