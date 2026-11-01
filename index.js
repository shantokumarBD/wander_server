import express from "express";
import "dotenv/config";
import { MongoClient, ObjectId } from "mongodb";
import cors from "cors";
import { createLocalJWKSet, createRemoteJWKSet, jwtVerify } from "jose";

const app = express();
const PORT = process.env.PORT || 5000;

const client = new MongoClient(process.env.DB_URL);

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}

const mongoClient = await connectToMongoDB();
const db = mongoClient.db("wander");
const destinationsCollection = db.collection("destinations");
const bookingsCollection = db.collection("bookings");

app.use(cors());
app.use(express.json());

const varifyToken = async(req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized" });
  }
  
  const token = authHeader.split(" ")[1];

  if (!token || token === "undefined") {
    return res.status(401).send({ message: "Unauthorized" });
  }

  const JWKS = createRemoteJWKSet(new URL(process.env.JWKS_URL || "http://localhost:3000/api/auth/jwks"));
  
  try {
    const { payload } = await jwtVerify(token, JWKS);
    req.user = payload;
    next();
  } catch (error) {
    console.error("JWT verification error:", error.message);
    return res.status(401).send({ message: "Unauthorized: Invalid token" });
  } 
};

app.get("/", (req, res) => {
  res.send("Wander server is running");
});

app.post("/add-destination",varifyToken, async (req, res) => {
  const data = req.body;
  const result = await destinationsCollection.insertOne(data);

  res.send({
    success: true,
    message: "Successfully added destination",
    data,
  });
});

app.post("/booking",varifyToken, async (req, res) => {
  const data = req.body;
  const result = await bookingsCollection.insertOne(data);

  res.send({
    success: true,
    message: "Successfully added booking",
    data,
  });
});

app.get("/my-bookings/:email", async (req, res) => {
  const { email } = req.params;

  const result = await bookingsCollection
    .find({
      email: email,
    })
    .toArray();

  res.send({
    success: true,
    message: "Successfully fetched bookings",
    data: result,
  });
});

app.delete("/my-bookings/:id" ,varifyToken,async (req, res) => {
  const { id } = req.params;
  const result = await bookingsCollection.deleteOne({ _id: new ObjectId(id) });

  res.send({
    success: true,
    message: "Successfully deleted booking",
    data: result,
  });
});

app.get("/all-destination", varifyToken, async (req, res) => {
  const result = await destinationsCollection.find().toArray();

  res.send({
    success: true,
    message: "Successfully fetched all destinations",
    data: result,
  });
});

app.get("/all-destination/:id",varifyToken, async (req, res) => {
  const { id } = req.params;

  const result = await destinationsCollection.findOne({
    _id: new ObjectId(id),
  });

  if (result) {
    res.send({
      success: true,
      data: result,
    });
  } else {
    res.send({
      success: false,
      message: "Destination not found",
    });
  }
});

app.put("/all-destination/:id", varifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    delete updateData._id;

    const result = await destinationsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData },
    );

    res.send({
      success: true,
      message: "Successfully updated destination",
      result,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
});

app.delete("/all-destination/:id", varifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await destinationsCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result) {
      res.send({
        success: true,
        message: "Successfully deleted destination",
        data: result,
      });
    } else {
      res.send({
        success: false,
        message: "Destination not found",
      });
    }
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
});

app.listen(PORT, () => {
  connectToMongoDB();
  console.log(`Server is running on port ${PORT}`);
});
