const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

const auth = require('./routes/auth');
const seller = require('./routes/seller');
const buyer = require('./routes/buyer');
const product = require('./routes/products'); // Import the products routes

const app = express();
app.use(bodyParser.json());

app.use('/auth', auth);
app.use('/seller', seller);
app.use('/buyer', buyer);
app.use('/api', product); // Use the product routes

// Define a route for the root URL
app.get('/', (req, res) => {
    res.send('Welcome to the API!');
  });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
