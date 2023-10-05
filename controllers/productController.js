const asyncHandler = require("express-async-handler");
const Product = require("../models/productModel");
const { fileSizeFormatter } = require("../utils/fileUpload");
//-There are some hosting providers may not allow you to upload and save image file on the server. So we save the image to
//a cloud service and it is cloudinary. We save it on cloudinary and display it on out web site.
const cloudinary = require("cloudinary").v2;

//Create Product
const createProduct = asyncHandler(async (req, res) => {
  const { name, sku, category, quantity, price, description } = req.body;

  //Validation
  if (!name || !category || !quantity || !price || !description) {
    res.status(400);
    throw new Error("Please fill in all fields");
  }

  //Handle Image upload
  let fileData = {};
  if (req.file) {
    //Save image to cloudinary
    let uploadedFile;
    try {
      //-The first argument is the location of file you want to upload.
      //-The second argument is an object that contains some setting
      //like where do you want to save the file.
      uploadedFile = await cloudinary.uploader.upload(req.file.path, {
        folder: "Pinvent App",
        resource_type: "image",
      });
    } catch (error) {
      res.status(500);
      throw new Error("Image could not be uploaded");
    }

    fileData = {
      fileName: req.file.originalname,
      //-That was where is the file located.
      filePath: uploadedFile.secure_url,
      fileType: req.file.mimetype,
      //-req.file.size is going to give us the size of file in bytes.
      //-So usually we want to convert it to kilobytes
      //-The second argument is how many decimal places do you want it to have?
      fileSize: fileSizeFormatter(req.file.size, 2),
    };
  }

  // Create Product
  const product = await Product.create({
    user: req.user.id,
    name,
    sku,
    category,
    quantity,
    price,
    description,
    image: fileData,
  });

  res.status(201).json(product);
});

//Get all Products
const getProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({
    user: req.user._id,
    //--createAt means the last product we created to be shown first.
  }).sort("-createAt");
  res.status(200).json(products);
});

//Get single product
const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  //If product doesn't exist
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  //Match product to its user
  if (product.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("User not authorized");
  }
  res.status(200).json(product);
});

//Delete Product
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  //If product doesn't exist
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  //Match product to its user
  if (product.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("User not authorized");
  }
  await product.deleteOne();
  res.status(200).json({
    message: "Product deleted.",
  });
});

//Update Product
const updateProduct = asyncHandler(async (req, res) => {
  const { name, category, quantity, price, description } = req.body;
  const { id } = req.params;
  const product = await Product.findById(id);

  //If product doesn't exist
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  //Match product to its user
  if (product.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("User not authorized");
  }

  //Handle Image upload
  let fileData = {};
  if (req.file) {
    //Save image to cloudinary
    let uploadedFile;
    try {
      uploadedFile = await cloudinary.uploader.upload(req.file.path, {
        folder: "PinventApp",
        resource_type: "image",
      });
    } catch (error) {
      res.status(500);
      throw new Error("Image could not be uploaded");
    }

    fileData = {
      fileName: req.file.originalname,
      filePath: uploadedFile.secure_url,
      fileType: req.file.mimetype,
      //-It is going to give us the size of file in bytes.
      //-So usually we want to convert it to kilobytes
      //-The second argument is how many decimal places do you want it to have?
      fileSize: fileSizeFormatter(req.file.size, 2),
    };
  }

  // Update Product
  const updatedProduct = await Product.findByIdAndUpdate(
    {
      _id: id,
    },
    {
      name,
      category,
      quantity,
      price,
      description,
      //-If there is not file that was uploaded, we are going to use the
      //previous image.

      //-The Object.keys() static method returns an array of a given object's own enumerable string-keyed property names.
      // const object1 = {
      //   a: 'somestring',
      //   b: 42,
      //   c: false,
      // };
      // console.log(Object.keys(object1));
      // Expected output: Array ["a", "b", "c"]

      //-Check if the fileData is an empty object.
      //-? optionally if there is an image, then use that.
      image: Object.keys(fileData).length === 0 ? product?.image : fileData,
    },
    //-If you want to update product, you need to tell your update functionality that, make
    //sure you run the validator that from the product model when you are updating product.
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json(updatedProduct);
});

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  deleteProduct,
  updateProduct,
};
