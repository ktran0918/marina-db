// const jwt = require('express-jwt');
// const jwksRsa = require('jwks-rsa');

const request = require('request-promise');
// const path = require('path');
const bodyParser = require('body-parser');
const randomstring = require('randomstring');
const express = require('express');
const oauth = require('./oauth');
const ds = require('./datastore');

const datastore = ds.datastore;

const router = express.Router();
router.use(bodyParser.json());

// var access_token;
// var state;
const client_id = '579423256180-lv1d1jv5utobfibghu578otdcooooafs.apps.googleusercontent.com';
const client_secret = 'hEc5NfLvYOkCBMyQcNIsd2mB';

router.use(bodyParser.urlencoded({ extended: true }));


router.get('/', async (req, res) => {
  let state = randomstring.generate(16);

  const options = {
    uri: 'https://accounts.google.com/o/oauth2/v2/auth',
    qs: {
      client_id: client_id,
      redirect_uri: 'https://marina-db2.appspot.com/login/auth',
      scope: 'profile email',
      response_type: 'code',
      state: state,
    },
  };

  try {
    let response = await request(options);
    res.send(response);
  } catch (err) {
    res.status(500).end();
    console.error(err);
  }
});

router.get('/auth', async (req, res) => {
  if (req.query.code) {
    let accessCode = req.query.code;

    try {
      let tokenResponse = await request({
        method: 'POST',
        uri: 'https://www.googleapis.com/oauth2/v4/token',
        body: {
          code: accessCode,
          client_id: client_id,
          client_secret: client_secret,
          redirect_uri: 'https://marina-db2.appspot.com/login/auth',
          grant_type: 'authorization_code'
        },
        json: true
      });

      let access_token = tokenResponse.access_token;
      let peopleResponse = await request({
        uri: 'https://people.googleapis.com/v1/people/me?personFields=names,emailAddresses',
        headers: {
          Authorization: `Bearer ${access_token}`
        },
        json: true
      });
      let name = peopleResponse.names[0]
      let email = peopleResponse.emailAddresses[0].value;

      // console.log(`First: ${name.givenName}`);
      // console.log(`Last: ${name.familyName}`);
      // console.log(`Email: ${email}`);

      // console.log(tokenResponse);
      id_token = tokenResponse.id_token;

      let userid = await oauth.verify(id_token);

      let query = datastore.createQuery('User');
      let entities = await datastore.runQuery(query);
      let results = entities[0].map(ds.fromDatastore);

      let existing_user = null;
      if (results) {
        existing_user = results.find(user => {
          if (user.uniqueId == userid) {
            return true;
          }
        });
      }

      if (!existing_user) {
        console.log('Creating new user...');
        let key = datastore.key('User');
        const new_user = {
          "firstName": name.givenName,
          "lastName": name.familyName,
          "uniqueId": userid
        };
        await datastore.save({ "key": key, "data": new_user });

        // new_user.jwt = id_token;
        // res.status(201).send(new_user);
        // } else {
        //   existing_user.jwt = id_token;
        //   res.status(200).send(existing_user);
      }
      res.status(200).send(id_token)
    } catch (err) {
      res.status(500).end();
      console.error(err);
    }
  }
});


module.exports = router;