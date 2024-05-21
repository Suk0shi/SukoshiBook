const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  following: [{ type: Schema.Types.ObjectId, ref: "User" }],
  followers: [{ type: Schema.Types.ObjectId, ref: "User" }],
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  iconUrl: { type: String, required: true },
  posts: [{ type: Schema.Types.ObjectId, ref: "Post" }],
  followRequests: [{ type: Schema.Types.ObjectId, ref: "User" }],
});


UserSchema.virtual("url").get(function () {
  // We don't use an arrow function as we'll need the this object
  return `/blog/user/${this._id}`;
});

// Export model
module.exports = mongoose.model("User", UserSchema);