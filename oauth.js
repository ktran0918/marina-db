const { OAuth2Client } = require('google-auth-library');

const CLIENT_ID = ''
const client = new OAuth2Client(CLIENT_ID);

module.exports.verify = async function (token) {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const userid = payload['sub'];
    // If request specified a G Suite domain:
    //const domain = payload['hd'];

    return userid;
}
