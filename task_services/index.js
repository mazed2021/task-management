const express = require("express");
const app = express();
const PORT=3002
const amqp=require("amqplib")
const cors=require("cors");
app.use(cors());
app.use(express.json());
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

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

const taskSchema= new mongoose.Schema({
    userId: String,
    title: String,
    description: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  });
  
  const Task = mongoose.model("Task", taskSchema);
 
// rabbitmq implementation
let channel,connection;

async function connectRabbitMQWithRetry(retries=5,
                                        delay=3000){

while(retries){
    try {
        connection = await amqp.connect("amqp://rabbitmq")
        channel = await connection.createChannel();
        await channel.assertQueue("task_created");
        console.log("connected to rabbitMQ");
        return;
    } catch (error) {
        console.error("rabbitmq connection error ", error.message)
        retries--;
        console.error("retries again ", retries);

        await new Promise(res=>setTimeout(res,delay))
    }
}

}





app.post('/create-task/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const { title, description } = req.body;
        const task = new Task({ userId, title, description });
        await task.save();
        const message = {
            taskId: task._id,
            userId,
            title
        }
        if(!channel){
            return res.status(503).json({
                error: "rabbitMQ not connect"
            })
        }

        channel.sendToQueue("task_created",Buffer.from(
            JSON.stringify(message)
        ))
        res.status(201).json({
            message: 'Task created successfully',
            task
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

app.get('/tasks/:userId', async (req, res) => {
    try {
        const tasks = await Task.find({ userId: req.params.userId });
        res.status(200).json(tasks);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

app.patch('/update-task/:id', async (req, res) => {
    try {
        const id =  req.params.id;
        const { title, description } = req.body;
        const task = await Task.findByIdAndUpdate({ _id:new mongoose.Types.ObjectId(id) }, { title, description }, { new: true });
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.status(200).json({
            message: 'Task updated successfully',
            task
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})
 app.delete('/delete-task/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const task = await Task.findOneAndDelete({ _id: new mongoose.Types.ObjectId(id) });
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.status(200).json({
            message: 'Task deleted successfully',
            task
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
 })

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    connectRabbitMQWithRetry();
});



