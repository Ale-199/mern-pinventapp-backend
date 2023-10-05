const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode ? res.statusCode : 500;

  res.status(statusCode);

  res.json({
    //This err.message come from "throw new Error("Please fill in all required fields");"
    message: err.message,
    //Explanation in 60.
    //err.stack will show you where the exact location of the error in the file.
    //We would not like our error stack to be displayed on production.
    stack: process.env.NODE_ENV === "development" ? err.stack : null,
  });
};

module.exports = errorHandler;
