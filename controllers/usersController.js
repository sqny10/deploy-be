const User = require("../models/User");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");

// @desc Get all users
// @route GET /users
// @access Private
const getAllUsers = asyncHandler(async (req, res) => {
    // Get all users from MongoDB
    const users = await User.find().select("-password").lean();

    // If no users
    if(!users?.length){
        return res.status(400).json({message: "No users found"});
    }

    res.json(users);
});

// @desc Create new user
// @route POST /users
// @access Private
const createNewUser = asyncHandler(async (req, res) => {
    const {username, password} = req.body;

    // Confirm data
    if(!username || !password){
        return res.status(400).json({message: "All fields are required"});
    }

    // Check for duplicate username
    const duplicate = await User.findOne({username}).collation({locale: "en", strength: 2}).lean().exec();

    if(duplicate){
        return res.status(409).json({message: `Username "${username}" already exist`});
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is salt rounds

    // Create and store a new user
    const userObject = {username, password: hashedPassword};

    const user = await User.create(userObject);

    if(user){
        res.status(201).json({message: `New user ${username} created`});
    }else{
        res.status(400).json({message: "Invalid user data received"});
    }
});

// @desc Update user
// @route PATCH /users
// @access Private
const updateUser = asyncHandler(async (req, res) => {
    const {id, username, password, roles, active} = req.body;

    // Confirm data
    if(!id || !username || !Array.isArray(roles) || !roles?.length || typeof active !== "boolean"){
        return res.status(400).json({message: "All fields except password are required"});
    }

    // Does the use exist to update?
    const user = await User.findById(id).exec();

    if(!user){
        return res.status(400).json({message: "User not found"});
    }

    // Check for duplicate
    const duplicate = await User.findOne({username}).collation({locale: "en", strength: 2}).lean().exec();

    if(duplicate && duplicate?._id.toString() !== id){
        return res.status(409).json({message: `Username "${username}" already exist`});
    }

    user.username = username;
    user.roles = roles;
    user.active = active;

    if(password){
        // Hash password
        user.password = await bcrypt.hash(password, 10); // 10 is salt rounds
        user.firstLogin = false;
    }

    const updatedUser = await user.save();
    res.json({message: `${updatedUser.username} updated`});
});

// @desc Delete user
// @route DELETE /users
// @access Private
const deleteUser = asyncHandler(async (req, res) => {
    const {id} = req.body;

    // Confirm data
    if(!id){
        return res.status(400).json({message: "User ID required"});
    }

    // Does user exist to delete
    const user = await User.findById(id).exec();

    if(!user){
        return res.status(400).json({message: "User not found"});
    }

    const result = await user.deleteOne();
    const reply = `Username "${result.username}" with an ID of "${result._id}" deleted`;

    res.json(reply);
});

module.exports = {getAllUsers, createNewUser, updateUser, deleteUser}