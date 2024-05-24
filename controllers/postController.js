const { body, validationResult } = require("express-validator");
const Post = require("../models/post");
const Comment = require("../models/comment");
const User = require("../models/user");
const Like = require("../models/like");
const asyncHandler = require("express-async-handler");
const { DateTime } = require("luxon");
const { JsonWebTokenError } = require("jsonwebtoken");
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Display detail page for a specific Author.
exports.posts = asyncHandler(async (req, res, next) => {
  try {    
    jwt.verify(req.token, `${process.env.JWT_KEY}`, async (err, authData) => {
      if(err) {
        return res.status(401).json('Login required');
      } else {
        const user = await User.findOne({ _id: authData.user._id }).exec();

        const userIdsToSearch = [...user.following, user._id];

        const posts = await Post.find({ user: { $in: userIdsToSearch } }).populate("user").exec();
        
        const postsWithCounts = await Promise.all(posts.map(async (post) => {
          let liked = false;
          const commentsCount = await Comment.countDocuments({ post: post._id });
          const likesCount = await Like.countDocuments({ post: post._id });
          const userLiked = await Like.findOne({ user: authData.user, post: post._id });
          if (userLiked) {
            liked = true;
          } 
          return {
            _id: post._id,
            iconUrl: post.user.iconUrl,
            user: post.user,
            name: post.name,
            date: post.date,
            text: post.text,
            imgUrl: post.imgUrl,
            commentsCount,
            likesCount,
            liked,
          };
        }));

        res.json({
          title: "Posts",
          posts: postsWithCounts,
          firstName: user.firstName,
          lastName: user.lastName,
          iconUrl: user.iconUrl,
        });
      }
    });
  } catch (error) {
    console.error('Error retrieving posts:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

exports.profilePosts = asyncHandler(async (req, res, next) => {
  try {  
    jwt.verify(req.token, `${process.env.JWT_KEY}`, async (err, authData) => {
      if(err) {
        return res.status(401).json('Login required');
      } else {
        const user = await User.findOne({ _id: authData.user._id }).exec();

        const posts = await Post.find({ user: user._id }).populate("user").exec();
        
        const postsWithCounts = await Promise.all(posts.map(async (post) => {
          let liked = false;
          const commentsCount = await Comment.countDocuments({ post: post._id });
          const likesCount = await Like.countDocuments({ post: post._id });
          const userLiked = await Like.findOne({ user: authData.user, post: post._id });
          if (userLiked) {
            liked = true;
          } 
          return {
            _id: post._id,
            iconUrl: post.user.iconUrl,
            user: post.user,
            name: post.name,
            date: post.date,
            text: post.text,
            imgUrl: post.imgUrl,
            commentsCount,
            likesCount,
            liked,
          };
        }));

        res.json({
          title: "Posts",
          posts: postsWithCounts,
          firstName: user.firstName,
          lastName: user.lastName,
          iconUrl: user.iconUrl,
        });
      }
    });
  } catch (error) {
    console.error('Error retrieving posts:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

exports.post_post = [
    // Validate and sanitize fields.
    body("text", "Please type a message to send")
      .trim()
      .isLength({ min: 1 })
      .escape(),
    // Process request after validation and sanitization.
  
    asyncHandler(async (req, res, next) => {
      jwt.verify(req.token, `${process.env.JWT_KEY}`,async (err, authData) => {
        if(err) {
          res.json('Login required')
        } else {
        // Extract the validation errors from a request.
        const errors = validationResult(req);
        // Create a Post object with escaped and trimmed data.
        const post = new Post({
          user: authData.user,
          iconUrl: authData.user.iconUrl,
          name: authData.user.firstName,
          date: DateTime.fromJSDate(new Date()).toLocaleString(DateTime.DATE_MED),
          text: req.body.text,
          imgUrl: req.body.imgUrl,
          likes: [],
          comments: [],
        });
    
        if (!errors.isEmpty()) {
          // There are errors. Render form again with sanitized values/error messages.
          res.json({
            title: "Post Error",
            post: post,
            errors: errors.array(),
          });
        } else {
          // Data from form is valid. Save user.
          await post.save();
          res.json("post sent")
        }
      }
    })
    })
  ];

  exports.post_detail = asyncHandler(async (req, res, next) => {
    // Get details of post and all their comments (in parallel)
    const [post, allCommentsForPost] = await Promise.all([
      Post.findById(req.params.id).populate("user").exec(),
      Comment.find({ post: req.params.id }).exec(),
    ]);
  
    if (post === null) {
      // No results.
      const err = new Error("Post not found");
      err.status = 404;
      return next(err);
    }
    console.log(post)
    res.json({
      title: "Post Detail",
      post: post,
      _id: post._id,
      iconUrl: post.user.iconUrl,
      user: post.user,
      name: post.name,
      date: post.date,
      text: post.text,
      imgUrl: post.imgUrl,
      post_comments: allCommentsForPost,
    });
});

exports.update_post = [

  // Validate and sanitize fields.
  body("name", "Please type a name")
      .trim()
      .isLength({ min: 1 })
      .escape(),
    body("title", "Please type a title")
      .trim()
      .isLength({ min: 1 })
      .escape(),
    body("text", "Please type a message to send")
      .trim()
      .isLength({ min: 1 })
      .escape(),
    body("published", "Please indicate publication status")
      .escape(),

  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    jwt.verify(req.token, `${process.env.JWT_KEY}`,async (err, authData) => {
      if(err) {
        res.json('Login required')
      } else {
        // Extract the validation errors from a request.
        const errors = validationResult(req);
        let published = false;
    
        if (req.body.published === "on") {
          published = true;
        }
    
        const post = new Post({
          name: req.body.name,
          date: 'Updated: ' + DateTime.fromJSDate(new Date()).toLocaleString(DateTime.DATE_MED),
          title: req.body.title,
          text: req.body.text,
          published: published,
          _id: req.params.id,
        });
        
          // Data from form is valid. Update the record.
          await Post.findByIdAndUpdate(req.params.id, post, {});
          // Redirect to book detail page.
          res.json(`post updated`)

      }})
      
  }),
];

exports.delete_post = asyncHandler(async (req, res, next) => {
  jwt.verify(req.token, `${process.env.JWT_KEY}`,async (err, authData) => {
    if(err) {
      res.json('Login required')
    } else { 
        await Post.findByIdAndDelete(req.params.id);
        await Comment.deleteMany({ post: req.params.id });
        
        res.json("Post Deleted");
    }})
});