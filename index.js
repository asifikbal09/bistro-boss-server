const express = require("express");
require("dotenv").config();
const app = express();
const jwt = require("jsonwebtoken");
const cors = require("cors");
const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY);
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    res.status(401).send({ error: true, message: "Unauthorized access" });
  }
  const token = authorization.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      res.status(401).send({ error: true, message: "Unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
};

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.duwavza.mongodb.net/?retryWrites=true&w=majority`;

console.log(process.env.DB_USER, process.env.DB_PASS);
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

const dbConnect = async () => {
  try {
    client.connect();
    console.log("Travel Database Connected!");
  } catch (error) {
    console.log(error.name, error.message);
  }
};
dbConnect();

//json web token api
app.post("/jwt", (req, res) => {
  const user = req.body;
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "1h",
  });
  res.send({ token });
});

const verifyAdmin = async (req, res, next) => {
  const email = req.decoded.email;
  const query = { email: email };
  const user = await userCollection.findOne(query);
  if (user?.role !== "admin") {
    return res.status(403).send({ error: true, message: "forbidden message" });
  }
  next();
};

//menu related api
app.get("/menu", async (req, res) => {
  const result = await menuCollection.find().toArray();
  res.send(result);
});

app.post("/menu", async (req, res) => {
  const newItem = req.body;
  const result = await menuCollection.insertOne(newItem);
  res.send(result);
});

app.delete("/menu/:id", async (req, res) => {
  const id = req.params.id;
  const query = {
    _id: new ObjectId(id),
  };
  const result = await menuCollection.deleteOne(query);
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

app.get("/cards", verifyJWT, async (req, res) => {
  const email = req.query.email;
  if (!email) {
    res.send([]);
  }
  const decodedEmail = req.decoded?.email;
  if (email !== decodedEmail) {
    return res.status(403).send({ error: true, message: "Forbidden access" });
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
app.get("/users/admin/:email", verifyJWT, async (req, res) => {
  const email = req.params.email;

  if (req.decoded.email !== email) {
    res.send({ admin: false });
  }

  const query = { email: email };
  const user = await userCollection.findOne(query);
  const result = { admin: user?.role === "admin" };
  res.send(result);
});

app.patch("/users/admin/:id", async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  const updateDoc = {
    $set: {
      role: "admin",
    },
  };
  const result = await userCollection.updateOne(filter, updateDoc);
  res.send(result);
});

// stripe payment api
app.post("/create-payment-intent", verifyJWT, async (req, res) => {
  const { price } = req.body;
  const amount = price * 100;
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount,
    currency: "usd",

    payment_method_types: ["card"],
  });
  res.send({
    clientSecret: paymentIntent.client_secret,
  });
});

console.log("Pinged your deployment. You successfully connected to MongoDB!");

app.get("/", (req, res) => {
  res.send("boss is setting");
});

app.listen(port, () => {
  console.log(`Bistro Boss is setting on port ${port}`);
});
