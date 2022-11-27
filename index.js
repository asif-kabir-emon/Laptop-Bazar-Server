const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET);

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// const uri = `mongodb://localhost:27017`;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@userc1.twqeubr.mongodb.net/?retryWrites=true&w=majority`;
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
    const categoriesCollection = client
      .db("LaptopBazer")
      .collection("categories");
    const productsCollection = client.db("LaptopBazer").collection("products");
    const bookingsCollection = client.db("LaptopBazer").collection("bookings");
    const paymentsCollection = client.db("LaptopBazer").collection("payments");

    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await usersCollection.findOne(query);
      if (result) {
        const token = jwt.sign(query, process.env.ACCESS_TOKEN, {
          expiresIn: "1d",
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

    app.get("/users/findUserByType/:userType", verifyJWT, async (req, res) => {
      const account_type = req.params.userType;
      const query = { account_type: account_type };
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/userFindCreate", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const result = await usersCollection.find(query).toArray();
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

    app.put("/users/verifyUser/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          isVerified: true,
        },
      };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    app.delete("/users/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });

    app.get("/categories", async (req, res) => {
      const query = {};
      const result = await categoriesCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/products/category/:id", async (req, res) => {
      const id = req.params.id;
      if (id === "1") {
        const query = {};
        const result = await productsCollection.find(query).toArray();
        return res.send({ name: "All", result });
      }
      const query = {
        category_id: id,
      };
      const category_id = { _id: ObjectId(id) };
      const category_name = await categoriesCollection
        .find(category_id)
        .toArray();
      const result = await productsCollection.find(query).toArray();
      res.send({ name: category_name[0].name, result });
    });

    app.get("/products/Advertise", async (req, res) => {
      const query = {
        isAdertise: true,
        isBooked: false,
      };
      const result = await productsCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/products/:email", async (req, res) => {
      const email = req.params.email;
      const query = {
        user_email: email,
      };
      const result = await productsCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/products", verifyJWT, async (req, res) => {
      const product = req.body;
      const result = await productsCollection.insertOne(product);
      res.send(result);
    });

    app.patch("/products/advertise/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = { $set: { isAdertise: true } };
      const result = await productsCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    app.delete("/products/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productsCollection.deleteOne(query);
      res.send(result);
    });

    app.get("/bookings/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const query = {
        buyer_email: email,
      };
      const result = await bookingsCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/bookings/search_by_id/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: ObjectId(id),
      };
      const result = await bookingsCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/bookings", verifyJWT, async (req, res) => {
      const bookingInfo = req.body;
      const product_id = bookingInfo.product_id;

      const filter_for_update_products = { _id: ObjectId(product_id) };
      const options1 = { upsert: true };
      const updateDoc1 = {
        $set: { isBooked: true },
      };
      const update1 = await productsCollection.updateMany(
        filter_for_update_products,
        updateDoc1,
        options1
      );

      if (update1) {
        const result = await bookingsCollection.insertOne(bookingInfo);
        res.send(result);
      }
    });

    app.get("/find-buyers/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const query = { seller_email: email };
      const result = await bookingsCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/create-payment-intent", verifyJWT, async (req, res) => {
      const booking = req.body;
      const price = booking.price;
      const amount = price * 100;

      const paymentIntent = await stripe.paymentIntents.create({
        currency: "usd",
        amount: amount,
        payment_method_types: ["card"],
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    app.post("/payments", verifyJWT, async (req, res) => {
      const paymentInfo = req.body;
      const payment = paymentInfo.payment;
      const result = await paymentsCollection.insertOne(payment);
      if (result) {
        const filter1 = { _id: ObjectId(paymentInfo.booking_id) };
        const options = { upsert: true };
        const updateDoc1 = {
          $set: {
            isPaid: true,
          },
        };
        const update1 = await bookingsCollection.updateOne(
          filter1,
          updateDoc1,
          options
        );

        const booking = await bookingsCollection.findOne(filter1);

        const filter2 = { _id: ObjectId(booking.product_id) };
        console.log(filter2);
        const updateDoc2 = {
          $set: {
            isSold: true,
          },
        };
        const update2 = await productsCollection.updateOne(
          filter2,
          updateDoc2,
          options
        );
      }
      res.send(result);
    });
  } finally {
  }
};

run().catch((error) => console.error(error));

app.listen(port, () => {
  console.log(`Server is running on Port ${port}`);
});
