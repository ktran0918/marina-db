const express = require('express');
const bodyParser = require('body-parser');
const { Datastore } = require('@google-cloud/datastore');
const url = require('url');

const oauth = require('./oauth');
const ds = require('./datastore');

const datastore = ds.datastore;

const BOAT = "Boat";

const router = express.Router();
router.use(bodyParser.json());


async function get_user_boats(req) {
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

    let user_boats = results.items.filter(boat => {
      if (boat.owner == req.params.user_id) {
        return true;
      }
    });

    return user_boats;
  } catch (error) {
    throw error;
  }
}


router.get('/:user_id/boats', async (req, res) => {
  let userid;
  try {
    let jwt = req.headers.authorization.split(' ')[1];
    userid = await oauth.verify(jwt);
    if (userid != req.params.user_id) {
      throw new Error(`user_id provided does not match the user id in JWT`);
    }
  } catch (err) {
    res.status(401).end();
    console.error(err);
    return;
  }

  try {
    let user_boats = await get_user_boats(req, userid);
    res.status(200).send(user_boats);
  } catch (err) {
    res.status(500).end();
    console.error(err);
  }
})


module.exports = router;