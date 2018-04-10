const express = require('express');
const jwt = require('')
const app = express()

app.post('/custom-login', (req, res) => {
  const customUsername = req.body.customUsername;
  const customPassword = req.body.customPassword;
  const customPin = req.body.customPin;

  if (!customUsername) {
    res.status(400).send({
      message: 'customUsername parameter cannot be empty'
    })
  }
  if (!customPassword) {
    res.status(400).send({
      message: 'customPassword parameter cannot be empty'
    })
  }
  if (!customPin) {
    res.status(400).send({
      message: 'customPin parameter cannot be empty'
    })
  }

  
})

const PORT = process.env.PORT || 9080