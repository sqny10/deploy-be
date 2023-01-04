const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    imgUrls:{
        type: [String],
        required: true
    },
    log: {
        type: Array,
        default: [],
    },
    available: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

productSchema.plugin(AutoIncrement, {
    inc_field: "no",
    id: "itemNums",
    start_seq: 1
});

module.exports = mongoose.model("Product", productSchema)