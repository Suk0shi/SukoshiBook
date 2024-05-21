const { body, validationResult } = require("express-validator");
const Like = require("../models/like");
const jwt = require('jsonwebtoken');
require('dotenv').config();

const asyncHandler = require("express-async-handler");

// Handle book create on POST.
exports.like_post = asyncHandler(async (req, res, next) => {
  try {
    const authData = await jwt.verify(req.token, `${process.env.JWT_KEY}`);

    // Extract the validation errors from a request.
    const errors = validationResult(req);

    const userLiked = await Like.findOne({ user: authData.user, post: req.params.id });

    // Create a Like object with user and post.
    const like = new Like({
      user: authData.user,
      post: req.params.id,
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.
      return res.status(400).json({ errors: errors.array() });
    } else if (userLiked) {
      await Like.findOneAndDelete({ _id: userLiked._id });
      return res.json({ comment: "Like Removed" });
    } else {
      // Data from form is valid. Save like.
      await like.save();
      return res.json({ comment: "Like Sent" });
    }
  } catch (error) {
    console.error('Error handling like:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});
  

  

