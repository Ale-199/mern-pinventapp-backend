//-With express-async-handler package, we don't we need to repeat try catch block.
//-Simple middleware for handling exceptions inside of async express
//routes and passing them to your express error handlers.

//-Simple middleware for handling exceptions inside of async express routes and
//passing them to your express error handlers
const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Token = require("../models/tokenModel");
//-Crypto is a module in Node. js which deals with an algorithm that
//performs data encryption and decryption
const crypto = require("crypto");
const sendEmail = require("../utils/sendemail");

const generatetoken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

// Register User
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  //Validation
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please fill in all required fields");
  }
  if (password.length < 6) {
    res.status(400);
    throw new Error("Password must be up to 6 characters");
  }

  //Check if user email already exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error("Email has already been used.");
  }

  //Create new user
  const user = await User.create({
    name,
    email,
    password,
  });

  //Generate Token
  const token = generatetoken(user._id);

  //Send HTTP-only cookie
  //-The first argument is the name of the cookie
  //-The second argument is the value of your cookie
  //-The third argument is describe how we are going to save our cookie
  res.cookie("token", token, {
    path: "/",
    httpOnly: true,
    expires: new Date(Date.now() + 1000 * 86400), //1 day
    sameSite: "none", //-This means that our front end and back end can have different URLs.
    secure: true,
  });

  if (user) {
    const { _id, name, email, photo, phone, bio } = user;
    //-The 201 status code indicates that the server has successfully processed
    //the request, the new resource has been created and is now ready for interaction
    res.status(201).json({
      _id,
      name,
      email,
      photo,
      phone,
      bio,
      token,
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

//Login User
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  //Validate request
  if (!email || !password) {
    res.status(400);
    throw new Error("Please provide email and password");
  }

  //Check if user exist
  const user = await User.findOne({ email });
  if (!user) {
    res.status(400);
    throw new Error("User not found, please sign up");
  }

  //User exists, check if password is correct.
  const passwordIsCorrect = await bcrypt.compare(password, user.password);

  //Generate Token
  const token = generatetoken(user._id);

  if (passwordIsCorrect) {
    // Send HTTP-only cookie
    res.cookie("token", token, {
      path: "/",
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 86400), // 1 day
      sameSite: "none",
      secure: true,
    });
  }

  if (user && passwordIsCorrect) {
    const { _id, name, email, photo, phone, bio } = user;
    res.status(200).json({
      _id,
      name,
      email,
      photo,
      phone,
      bio,
      token,
    });
  } else {
    res.status(400);
    throw new Error("Invalid email and password");
  }
});

//Logout User
const logoutUser = asyncHandler(async (req, res) => {
  res.cookie("token", "", {
    path: "/",
    httpOnly: true,
    expires: new Date(0), // 1 day
    sameSite: "none",
    secure: true,
  });
  return res.status(200).json({
    message: "Successfully logged out",
  });
});

//Get User Data
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    const { _id, name, email, photo, phone, bio } = user;
    res.status(201).json({
      _id,
      name,
      email,
      photo,
      phone,
      bio,
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

//Get Login status
const loginStatus = asyncHandler(async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json(false);
  }

  //Verify token
  const verified = jwt.verify(token, process.env.JWT_SECRET);

  console.log(verified);
  //{ id: '650b770cac7b2df07bb18feb', iat: 1695332911, exp: 1695419311 }
  //-iat (issued at time): Time at which the JWT was issued

  if (verified) {
    return res.json(true);
  }
});

//Update user
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    const updatedUser = await User.findOneAndUpdate(
      { _id: user._id },
      {
        ...req.body,
      }
    ).select("-password");
    res.status(200).json(updatedUser);
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

//Change password
const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { oldPassword, password } = req.body;

  if (!user) {
    res.status(400);
    throw new Error("User not found, please sign up");
  }

  //validate
  if (!oldPassword || !password) {
    res.status(400);
    throw new Error("Please add old and new password");
  }

  //check if old password matches password in DB
  const passwordIsCorrect = await bcrypt.compare(oldPassword, user.password);

  //Save new password
  if (user && passwordIsCorrect) {
    user.password = password;
    await user.save();
    res.status(200).send("Password change successfully");
  } else {
    res.status(400);
    throw new Error("Old password is incorrect");
  }
});

//Forgot password
//-read the instructions.txt
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error("User does not exist");
  }

  //Delete token if it exists in DB
  let token = await Token.findOne({
    userId: user._id,
  });

  if (token) {
    await token.deleteOne();
  }

  //Create Reset Token, and it is not a jwt token.
  //-randomBytes()	Creates random data
  //-toString() convert to string hex formate
  let resetToken = crypto.randomBytes(32).toString("hex") + user._id;
  console.log(resetToken);

  //Hash resetToken before saving to DB
  const hashedToken = crypto
    //-algorithm we want to use. - sha256
    .createHash("sha256")
    //-specify what we wan to hash.
    .update(resetToken)
    //-creating the digest in hex encoding
    .digest("hex");

  //Save resetToken to DB
  //-Another way to create a new object
  await new Token({
    userId: user._id,
    token: hashedToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * (60 * 1000), //30 minutes
  }).save();

  //Construct Reset Url
  const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

  //Reset Email
  const message = `
    <h2>Hello ${user.name} </h2>
    <p>Please use the url below to reset your password</p>
    <p>This reset link is valid for only 30 minutes</p>
    // it's all about tracking user clicks
    <a href=${resetUrl} clicktracking=off>${resetUrl}</a>

    <p>Regards....</p>
    <p>Pinvent Team</p>
    
  `;

  const subject = "Password Reset Request ";
  const send_to = user.email;
  const sent_from = process.env.EMAIL_USER;

  try {
    await sendEmail(subject, message, send_to, sent_from);
    res.status(200).json({ success: true, message: "Reset email sent" });
  } catch {
    res.status(500);
    throw new Error("Email not sent, please try again");
  }
});

//Reset password
const resetpassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { resetToken } = req.params;

  //We need to convert the resetToken to what we stored in the DB.
  //Hash token, then compare it to Token in DB.
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  //find resetToken in DB
  const userToken = await Token.findOne({
    token: hashedToken,
    //check if the token that i found in the database has expired.
    expiresAt: { $gt: Date.now() },
  });

  if (!userToken) {
    res.status(404);
    throw new Error("Invalid or Expired Token");
  }

  //Find user
  const user = await User.findOne({
    _id: userToken.userId,
  });
  user.password = password;
  await user.save();
  res.status(200).json({
    message: "Password Reset successfully, please login.",
  });

  //delete the token
  if (userToken) {
    await userToken.deleteOne();
  }
});

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getUser,
  loginStatus,
  updateUser,
  changePassword,
  forgotPassword,
  resetpassword,
};
