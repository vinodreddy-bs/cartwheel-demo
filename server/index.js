require('dotenv').config();
const { createApp } = require('./app');

const PORT = Number(process.env.PORT) || 5001;

createApp({ log: process.env.NODE_ENV !== 'test' }).listen(PORT, () => {
  console.log(`Cartwheel API listening on http://localhost:${PORT}`);
});
