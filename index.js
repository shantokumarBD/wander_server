import express from 'express'
import 'dotenv/config'
import { MongoClient } from 'mongodb';

const app = express()
const PORT = process.env.PORT || 5000

const client = new MongoClient(process.env.DB_URL)

export async function connectToMongoDB() {
    try {
        await client.connect();
        console.log("You successfully connected to MongoDB!");
        return client;
    } catch (err) {
        console.dir(err);
    }
}




app.get("/", (req, res) => {
  res.send("Wander server is running");
});


app.listen(PORT, () => {
  connectToMongoDB()
  console.log(`Server is running on port ${PORT}`);
});

