const { Buffer } = require('safe-buffer');
const Keygrip = require('keygrip');
const config = require('../../config/keys');
const keygrip = new Keygrip([config.cookieKey]);

module.exports = (user) => {
  const sessionObjet = {
    passport: {
      user: user._id.toString(),
    }
  };

  const session = Buffer.from(JSON.stringify(sessionObjet)).toString('base64');

  const sig = keygrip.sign(`session=${session}`);

  return { session, sig };
};