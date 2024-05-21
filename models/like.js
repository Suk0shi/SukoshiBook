const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const LikeSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true},
  post: { type: Schema.Types.ObjectId, ref: "Post" },
  comment: { type: Schema.Types.ObjectId, ref: "Comment" },
});


LikeSchema.virtual("url").get(function () {
  // We don't use an arrow function as we'll need the this object
  return `/blog/comment/${this._id}`;
});

// Export model
module.exports = mongoose.model("Like", LikeSchema);