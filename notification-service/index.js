const amqp = require("amqplib")


async function start() {
    try {
        connection = await amqp.connect("amqp://rabbitmq")
        channel = await connection.createChannel();
        await channel.assertQueue("task_created");
        console.log("notification service connected to rabbitMQ");
        channel.consume("task_created", (msg) => {
            const taskData = JSON.parse(msg.content.toString());
            console.log("notification : new task :", taskData.title)
            console.log("notification : new task :", taskData)
            channel.ack(msg)
        })
        return;
    } catch (error) {
        console.error("rabbitmq connection error ", error.message)
    }
}
start();