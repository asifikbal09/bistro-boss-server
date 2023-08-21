const express = require("express");
const app = express();
const jwt = require('jsonwebtoken');
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.duwavza.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// collection
const menuCollection = client.db("BistroDb").collection("menu");
const userCollection = client.db("BistroDb").collection("users");
const reviewCollection = client.db("BistroDb").collection("review");
const cardCollection = client.db("BistroDb").collection("cards");

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    //menu related api
    app.get("/menu", async (req, res) => {
      const result = await menuCollection.find().toArray();
      res.send(result);
    });
    //review related api
    app.get("/review", async (req, res) => {
      const result = await reviewCollection.find().toArray();
      res.send(result);
    });

    //user related api
    app.get("/users", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingOne = await userCollection.findOne(query);
      if (existingOne) {
        return { message: "user already exist" };
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    // add to card
    app.post("/cards", async (req, res) => {
      const item = req.body;
      console.log(item);
      const result = await cardCollection.insertOne(item);
      res.send(result);
    });

    app.get("/cards", async (req, res) => {
      const email = req.query.email;
      if (!email) {
        res.send([]);
      }
      const query = { email: email };
      const result = await cardCollection.find(query).toArray();
      res.send(result);
    });

    app.delete("/cards/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cardCollection.deleteOne(query);
      res.send(result);
    });

    // user updated api
    app.patch("/users/admin/:id", async(req,res)=>{
      const id = req.params.id
      const filter = {_id : new ObjectId(id)}
      const updateDoc ={
        $set:{
          role:"admin"
        }
      }
      const result = await userCollection.updateOne(filter,updateDoc)
      res.send(result)
    })

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("boss is setting");
});

app.listen(port, () => {
  console.log(`Bistro Boss is setting on port ${port}`);
});
