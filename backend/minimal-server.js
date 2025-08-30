const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.json({ message: 'Minimal server working!' });
});

app.listen(3000, () => {
  console.log('Minimal server running on port 3000');
  console.log('Press Ctrl+C to stop');
});
