const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const app = express();

const privateKey = fs.readFileSync('./privatekey.pem');

app.use(bodyParser.json())
app.post('/custom-login', (req, res) => {
  const customUsername = req.body.customUsername;
  const customPassword = req.body.customPassword;
  const customPin = req.body.customPin;
  
  // BEGIN: This is just a simulation of custom authentication logic.
  if (!customUsername || customUsername === '') {
    res.status(400).send({
      message: 'customUsername parameter cannot be empty'
    });
    return;
  }

  if (customPassword !== 'iloverealm') {
    res.status(401).send({
      message: `Oh no your customPassword field value is isn't equal to 'iloverealm'`
    });
    return;
  }

  if (customPin !== '1234') {
    res.status(400).send({
      message: 'customPin parameter cannot be empty'
    });
    return;
  }

  const payload = {
    userId: customUsername,
    isAdmin: true // optional
    // other properties (ignored by Realm Object Server)
  };
  // END: This is just a simulation of custom authentication logic.

  const jwtToken = jwt.sign(payload, privateKey, { algorithm: 'RS256' });
  res.send({
    jwtToken: jwtToken
  })
});

const PORT = process.env.PORT || 8080
app.listen(PORT, () => {
  console.log(`Express server is listening on ${PORT}`);
});
