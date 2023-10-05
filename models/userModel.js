const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      //-If the use do not input a name, we send back a message.
      //-It would be better do the validation in both frontEnd and backEnd
      required: [true, "Please add a name"],
    },
    email: {
      type: String,
      required: [true, "Please add a email"],
      unique: true,
      //-Remove any space around the email.
      trim: true,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
      minLength: [6, "Password must be up to 6 characters"],
      //maxLength: [23, "Password must not be more than 23 characters "],
    },
    photo: {
      type: String,
      required: [true, "Please add a photo"],
      //-If the user did not provide the photo, we set it as default img.
      default: "https://i.ibb.co/4pDNDk1/avatar.png",
    },
    phone: {
      type: String,
      default: "+1",
    },
    bio: {
      type: String,
      default: "bio",
      maxLength: [250, "Bio must not be more than 250"],
    },
  },
  {
    timestamps: true,
  }
);

//-This will make sure our password is alway hashed, before we save it in the mongoDB
//Encrypt password before saving to DB
userSchema.pre("save", async function (next) {
  //if the password is not modified, go to next execute next pice of code
  if (!this.isModified("password")) {
    return next();
  }

  //Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(this.password, salt);
  this.password = hashedPassword;
  next();
});

const User = mongoose.model("User", userSchema);
module.exports = User;
