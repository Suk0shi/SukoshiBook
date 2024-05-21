const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const PostSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true},
  name: { type: String, required: true },
  date: { type: String, required: true },
  text: { type: String, required: true },
  likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
  imgUrl: { type: String },
});


PostSchema.virtual("url").get(function () {
  // We don't use an arrow function as we'll need the this object
  return `/blog/post/${this._id}`;
});

// Export model
module.exports = mongoose.model("Post", PostSchema);