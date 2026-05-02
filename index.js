const dns = require('dns')
dns.setServers(['1.1.1.1'])

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const router = require('./Route/routes');

require('./config/db');
const corsOptions = {
  origin: [
    "http://localhost:5173",         
    "http://localhost:3000",        
    "https://xoriva.vercel.app",            
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,                 
};

app.use(cors(corsOptions));
app.use(express.json());   
app.use('/api', router);

app.get('/', (req, res) => {
    res.send('Hey!Welcome to XORIVA');
});

const port = process.env.PORT ||  3000;     
  

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});