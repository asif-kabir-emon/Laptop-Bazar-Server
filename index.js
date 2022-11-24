const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const uri = `mongodb://localhost:27017`;
// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@userc1.twqeubr.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

app.get("/", (req, res) => {
  res.send("Laptop Bazar API is running");
});

const run = async () => {
  try {
    const usersCollection = client.db("LaptopBazer").collection("users");
  } finally {
  }
};

run().catch((error) => console.error(error));

app.listen(port, () => {
  console.log(`Server is running on Port ${port}`);
});
