const mongoose = require('mongoose');


module.exports.connect = async () => {
    try {
       await mongoose.connect(process.env.MONGO_URI)
       console.log("Mongodb Connect Successfully")
    } catch (error) {
        console.log(error)
        console.log("Mongodb Connect Failed")
    }
}

// aye10diemtoan0_db_user SEDY4ok2S2AndYoZ
// mongodb+srv://aye10diemtoan0_db_user:SEDY4ok2S2AndYoZ@cluster0.evtjoau.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0