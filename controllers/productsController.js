const User = require("../models/User");
const Product = require("../models/Product");
const asyncHandler = require("express-async-handler");

// @desc Get all products
// @route GET /products
// @access Private
const getAllProducts = asyncHandler(async (req, res) => {
    // Get all the products from MongoDB
    const products = await Product.find().lean();

    // If no products
    if(!products?.length){
        return res.status(400).json({message: "No products found"});
    }

    // Add username inside the log section before send.
    const productsWithUsernameInsideLog = await Promise.all(products.map(async (product) => {
        const modifiedLog = await Promise.all(product.log.map(async (logItem) => {
            const user = await User.findById(logItem.userId).lean().exec();
            return {...logItem, username: user ? user.username : "[deleted-user]"}
        }));

        return {...product, log: modifiedLog}
    }));

    res.json(productsWithUsernameInsideLog);
});

// @desc Create new product
// @route POST /products
// @access Private
const createNewProduct = asyncHandler(async (req, res) => {
    const {title, description, imgUrls, userId, amount} = req.body;

    // Confirm data
    if(!title || !description || !Array.isArray(imgUrls) || !userId || !amount || typeof amount !== "number"){
        return res.status(400).json({message: "All fields are required"});
    }

    // Check for duplicate
    const duplicate = await Product.findOne({title}).collation({locale: "en", strength: 2}).lean().exec();

    if(duplicate){
        return res.status(409).json({message: `Title "${title}" already exist`});
    }

    // Create the log Object
    const logItem = {userId, amount, operationTime: Date.now()}

    // Create the product Object and save
    const productObject = {title, description, imgUrls, log: [logItem]};

    const product = await Product.create(productObject);

    if(product){
        return res.status(201).json({message: "New product created"});
    }else{
        return res.status(400).json({message: "Invalid product data received"});
    }
});

// @desc Update product
// @route PATCH /products
// @access Private
const updateProduct = asyncHandler(async (req, res) => {
    const {id, title, description, imgUrls, userId, amount, available} = req.body;

    // Confirm data
    if(!id || !title || !description || !Array.isArray(imgUrls) || !userId || typeof available !== "boolean"){
        return res.status(400).json({message: "All fields are required"});
    }

    // Check for product is exists to update
    const product = await Product.findById(id).exec();

    if(!product){
        return res.status(400).json({message: "Product not found"});
    }

    // Check for duplicate title
    const duplicate = await Product.findOne({title}).collation({locale: "en", strength: 2}).lean().exec();

    if(duplicate && duplicate._id.toString() !== id){
        return res.status(409).json({message: `Title "${title}" already exist`});
    }

    product.title = title;
    product.description = description;
    product.imgUrls = imgUrls;
    product.available = available;

    // If amount received add to log
    if(amount && typeof amount === "number"){
        product.log = [...product.log, {userId, amount, operationTime: Date.now()}];
    }

    const updatedProduct = await product.save();

    res.json({message: `${updatedProduct.title} updated`});
});

// @desc Delete product
// @route DELETE /products
// @access Private
const deleteProduct = asyncHandler(async (req, res) => {
    const {id} = req.body;

    // Confirm data
    if(!id){
        return res.status(400).json({message: "ID is required"});
    }

    // Check for product exists to delete
    const product = await Product.findById(id).exec();

    if(!product){
        return res.status(400).json({message: "Product not found"});
    }

    const result = await product.deleteOne();

    const reply = `Product "${result.title}" with an ID of "${result._id}" deleted`;
    
    res.json(reply);
});

module.exports = {getAllProducts, createNewProduct, updateProduct, deleteProduct}