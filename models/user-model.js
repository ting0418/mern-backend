const mongoose = require("mongoose");
const { Schema } = mongoose;
const bcrypt = require("bcrypt");
const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 50,
  },
  email: {
    type: String,
    required: true,
    minlength: 6,
    maxlength: 50,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
    enum: ["學生", "老師"],
  },
  date: {
    type: Date,
    default: Date.now(),
  },
});

// instance methods
userSchema.methods.isStudent = function () {
  return this.role == "學生";
};
userSchema.methods.isInstructor = function () {
  return this.role == "老師";
};

userSchema.methods.comparePassword = async function (password, cb) {
  let result;
  try {
    result = await bcrypt.compare(password, this.password);
    return cb(null, result);
  } catch (e) {
    return cb(e, result);
  }
};

// mongoose middlewares
// 若使用者為新用戶，或是正在更改密碼。則將密碼進行雜湊處理
userSchema.pre("save", async function (next) {
  // this代表mondoDB內的document
  if (this.isNew || this.isModified("password")) {
    const hashValue = await bcrypt.hash(this.password, 10);
    this.password = hashValue;
  }
  next();
});

module.exports = mongoose.model("User", userSchema);
