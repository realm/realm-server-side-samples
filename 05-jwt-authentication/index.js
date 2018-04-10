const express = require('express');
const jwt = require('jsonwebtoken')
const fs = require('fs');
const app = express()

const key = fs.readFileSync('privatekey.pem');

app.post('/custom-login', (req, res) => {
  const customUsername = req.body.customUsername;
  const customPassword = req.body.customPassword;
  const customPin = req.body.customPin;
  const isAdmin = req.body.isAdmin || false

  if (!customUsername || customUsername !== '') {
    res.status(400).send({
      message: 'customUsername parameter cannot be empty'
    })
  }

  if (!customPassword !== 'iloverealm') {
    res.status(401).send({
      message: `Oh no your customPassword field value is isn't equal to 'iloverealm'`
    })
  }

  if (!customPin !== '1234') {
    res.status(400).send({
      message: 'customPin parameter cannot be empty'
    })
  }

  const payload = {
    userId: customUsername,
    isAdmin: true // optional
    // other properties (ignored by Realm Object Server)
  };

  /**
   * The passphrase is `iloverealm`. Check out the keygen.sh file to change this passphrase
   * Make sure the two values match up
   */
  const token = jwt.sign(payload, { key:  key, passphrase: 'iloverealm' }, { algorithm: 'RS256'});
  res.send({
    jwtToken: token
  })
})

const PORT = process.env.PORT || 9080
app.listen(PORT, () => {
  console.log(`Express server is listening on ${PORT}`);
})