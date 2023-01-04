const mongoose = require("mongoose");

const connectDb = async () => {
    try {
        mongoose.set("strictQuery", false);
        await mongoose.connect(process.env.DATABASE_URI)
    } catch (error) {
        console.log(error)
    }
}

module.exports = connectDb