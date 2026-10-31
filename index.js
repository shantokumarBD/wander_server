import express from 'express'
import 'dotenv/config'
import { MongoClient, ObjectId } from 'mongodb';
import cors from 'cors'

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

const mongoClient = await connectToMongoDB()
const db = mongoClient.db('wander')
const destinationsCollection = db.collection('destinations')

app.use(cors())
app.use(express.json())

app.get("/", (req, res) => {
  res.send("Wander server is running");
});

app.post('/add-destination', async (req, res) => {
  const data = req.body
  const result = await destinationsCollection.insertOne(data)

  res.send({
    success: true,
    message: 'Successfully added destination',
    data
  })
})

app.get('/all-destination', async(req, res)=>{
  const result = await destinationsCollection.find().toArray()
  console.log(result);
  
  res.send({
    success: true,
    message: 'Successfully fetched all destinations',
    data: result
  })
})

app.get('/all-destination/:id', async(req, res)=>{
  const {id} = req.params 

  const result = await destinationsCollection.findOne({
    _id: new ObjectId(id)
  })

  if(result){
    res.send({
      success: true,
      data: result
    })
  }
  else {
    res.send({
      success: false,
      message: 'Destination not found'
    })
  }
})

app.put('/all-destination/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    delete updateData._id;

    const result = await destinationsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    res.send({
      success: true,
      message: 'Successfully updated destination',
      result,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
});

app.delete('/all-destination/:id', async(req, res)=>{
  try {
    const {id} = req.params
    const result = await destinationsCollection.deleteOne({_id: new ObjectId(id)})
    
    if(result){
      res.send({
        success: true,
        message: 'Successfully deleted destination',
        data: result
      })
    }
    else {
      res.send({
        success: false,
        message: 'Destination not found'
      })
    }
    
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    })
  }

})

app.listen(PORT, () => {
  connectToMongoDB()
  console.log(`Server is running on port ${PORT}`);
});
