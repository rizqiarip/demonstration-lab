const express = require('express');
const PORT = 8000;
const app = express();
app.get('/', (req, res) => {
  res.send('Hello World - Tes simple nodejs app - arip');
});
app.listen(PORT);
console.log(`Running on ${PORT}`);
