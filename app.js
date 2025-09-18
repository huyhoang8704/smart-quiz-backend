const express = require('express');
const app = express()
const port = 3000;
require('dotenv').config()


// Connect to MongoDB
const connectDB = require('./config/connectMongoDB')
connectDB.connect()


app.get('/',(req, res) => {
    res.send('Trang chủ')
})


app.listen(port , () =>{
    console.log(`App listening on port ${port}`);
})