const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const jwt = require("jsonwebtoken");
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

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send("unathorized access");
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send("forbidden access");
    }
    req.decoded = decoded;
    next();
  });
}

app.get("/", (req, res) => {
  res.send("Laptop Bazar API is running");
});

const run = async () => {
  try {
    const usersCollection = client.db("LaptopBazer").collection("users");

    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await usersCollection.findOne(query);
      if (result) {
        const token = jwt.sign(query, process.env.ACCESS_TOKEN, {
          expiresIn: "10h",
        });
        return res.send({ accessToken: token });
      }
      res.status(401).send({ accessToken: "" });
    });

    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/userFindCreate", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const result = await usersCollection.find(query).toArray();
      console.log(result.length);
      if (result.length < 1) {
        const newUser = await usersCollection.insertOne(user);
        return res.send({ result: true });
      }
      res.send({ result: true });
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(user);
    });
  } finally {
  }
};

run().catch((error) => console.error(error));

app.listen(port, () => {
  console.log(`Server is running on Port ${port}`);
});
