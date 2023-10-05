const dotenv = require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const userRoute = require("./routes/userRoute");
const productRoute = require("./routes/productRoute");
const contactRoute = require("./routes/contactRoute");
const errorHandler = require("./middleWare/errorMiddleware");
const cookieParser = require("cookie-parser");
const path = require("path");

//init express
const app = express();

//Middlewares
app.use(express.json()); //This is going to help us handle json data in our application.
app.use(cookieParser()); //-Cookie-parser is a middleware which parses cookies attached to the client request object.
app.use(
  express.urlencoded({
    extended: false,
  })
); //-This will help us to handle data that comes via the URL
app.use(bodyParser.json()); //-The body parser helps us pass that data and convert it to an object that
//we can easily access in the backend.
app.use(
  //-This is important when you want to make a request and you want to
  //exchange credentials.
  cors({
    //specify the URL that we are going to be making request from to the backend.
    origin: ["http://localhost:3000", "https://alepinvent-app.vercel.app/"],
    // https://alepinvent-app.vercel.app/
    //-To enable exchange of credentials or sending the credentials from backend to the front end.

    //-Credentials are cookies, authorization headers, or TLS client certificates. When used as part of a response to a preflight request,
    //this indicates whether or not the actual request can be made using credentials.
    credentials: true,
  })
);

//-We link up our uploads functionality is going to point to the upload folder.
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

//Routes Middleware
app.use("/api/users", userRoute);
app.use("/api/products", productRoute);
app.use("/api/contactus", contactRoute);
//Routes
app.get("/", (req, res) => {
  res.send("home page");
});

//Error Middleware
app.use(errorHandler);

//Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server Running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
