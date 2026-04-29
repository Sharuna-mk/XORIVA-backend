const dns = require('dns')
dns.setServers(['1.1.1.1'])

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const router = require('./Route/routes');

require('./config/db');
app.use(cors());
app.use(express.json());   
app.use(router);

app.get('/', (req, res) => {
    res.send('Welcome to XORIVA');
});

const port = process.env.PORT ||  3000;     

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});