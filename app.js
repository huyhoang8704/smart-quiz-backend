const express = require('express');
const app = express()
const cors = require('cors')
require('dotenv').config()

// CORS
app.use(cors())
const port = process.env.PORT || 4000

// Connect to MongoDB
const connectDB = require('./config/connectMongoDB')
connectDB.connect()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
const authRoute = require('./routes/authRoute')
app.use('/api/auth', authRoute)

app.get('/healthcheck',(req, res) => {
    res.send('Health check ok')
})


app.listen(port , () =>{
    console.log(`App listening on port ${port}`);
})