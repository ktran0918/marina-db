// const jwt = require('express-jwt');
// const jwksRsa = require('jwks-rsa');

const request = require('request-promise');
// const path = require('path');
const bodyParser = require('body-parser');
const randomstring = require('randomstring');
const express = require('express');

const router = express.Router();
router.use(bodyParser.json());

// var access_token;
// var state;
const client_id = '961976822144-5fkk08685mcgukj5v2kmmucn6hofcn65.apps.googleusercontent.com';
const client_secret = 'koywNqrzuoq6eKBBITf4pB1S';

router.use(bodyParser.urlencoded({ extended: true }));
// router.use(express.static(__dirname));

// router.get('/', async (req, res) => {
//   res.sendFile(path.join(__dirname, '/index.html'));
// });

router.get('/', async (req, res) => {
  let state = randomstring.generate(16);

  const options = {
    uri: 'https://accounts.google.com/o/oauth2/v2/auth',
    qs: {
      client_id: client_id,
      redirect_uri: 'https://marina-db.appspot.com/login/auth',
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
          redirect_uri: 'https://marina-db.appspot.com/login/auth',
          grant_type: 'authorization_code'
        },
        json: true
      });

      // access_token = tokenResponse.access_token;
      id_token = tokenResponse.id_token;

      // let peopleResponse = await request({
      //   uri: 'https://people.googleapis.com/v1/people/me?personFields=names,emailAddresses',
      //   headers: {
      //     Authorization: `Bearer ${access_token}`
      //   },
      //   json: true
      // });

      // let firstName = peopleResponse.names[0].givenName;
      // let lastName = peopleResponse.names[0].familyName;

      // res.send(`<p><strong>First name:</strong> ${firstName}<br>
      // <strong>Last name:</strong> ${lastName}<br>
      // <strong>State</strong>: ${state}</p>`);

      res.send(id_token);
    } catch (err) {
      res.status(500).end();
      console.error(err);
    }
  }
});



module.exports = router;