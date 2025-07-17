const express = require("express");
const app = express();
const PORT=3001
const cors=require("cors");
app.use(cors());
app.use(express.json());

const mongoose = require("mongoose");

// mongoose.connect("mongodb://127.0.0.1:27017/users").then(() => {
//     console.log("Connected to MongoDB");
// }).catch((error) => {
//     console.error("Error connecting to MongoDB:", error);
// });


mongoose.connect("mongodb://mongo:27017/users").then(() => {
    console.log("Connected to MongoDB");
}).catch((error) => {
    console.error("Error connecting to MongoDB:", error);
});

const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String
});

const User = mongoose.model("User", UserSchema);
 
app.post('/Register',async(req,res)=>{
    const {name,email,password}=req.body;
    const user=await User.create({name,email,password});
    user.save();
    res.json({
        message:"User created successfully",
        user
    });
})

app.get('/getUser',async(req,res)=>{
    const user=await User.find();
    res.json({
        message:"User find successfully",
        user
    });
})
app.delete('/deleteUser/:id',async(req,res)=>{
    const id=req.params.id;
    const user=await User.findByIdAndDelete(id);
    res.json({
        message:"User deleted successfully",
        user
    });
})
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});



