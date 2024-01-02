const mongoose = require("mongoose");
const { Schema } = mongoose;

const courseSchema = new Schema({
  id: {
    type: String,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  price: {
    type: Number,
    required: true,
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    // 連結到哪邊
    ref: "User",
  },
  students: {
    type: [String],
    default: [],
  },
});
module.exports = mongoose.model("course", courseSchema);
