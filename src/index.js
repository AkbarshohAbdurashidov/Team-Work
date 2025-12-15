const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(express.json());

app.use('/roomtypes', require('./routes/roomtypes.routes'));
app.use('/rooms', require('./routes/rooms.routes'));
app.use('/customers', require('./routes/customers.routes'));

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
