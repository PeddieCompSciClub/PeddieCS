const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(5630, () => {
  console.log('Test app listening on port 5630!');
});
