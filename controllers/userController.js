const { body, validationResult } = require("express-validator");
const User = require("../models/user");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.login = asyncHandler(async (req, res, next) => {
    // Get details of books, book instances, authors and genre counts (in parallel)
    
  
    res.json({
      title: "Login",
      user: req.user
    });
});

exports.signUp = asyncHandler(async (req, res, next) => {
    res.json({
        title: "Sign Up"
    });
});

exports.signUp_post = [
    // Validate and sanitize fields.
    body("firstName", "Name must not be empty.")
      .trim()
      .isLength({ min: 1 })
      .escape(),
    body("lastName", "LastName must not be empty.")
      .trim()
      .isLength({ min: 1 })
      .escape(),
    body("email", "Email must not be empty.")
      .trim()
      .isLength({ min: 1 })
      .escape(),
    body("password", "Password must not be empty")
      .trim()
      .isLength({ min: 1 })
      .escape(),
    body("passwordConfirm", "Password confirmation must match")
      .custom((value, { req }) => {
        return value === req.body.password;
      }),
    // Process request after validation and sanitization.

    asyncHandler(async (req, res, next) => {
        bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
          // Extract the validation errors from a request.
          const errors = validationResult(req);
    
          const [findUser, findEmail] = await Promise.all([
            User.findOne({ username: req.body.firstName + ' ' + req.body.lastName }).exec(),
            User.findOne({ email: req.body.email }).exec(),
          ]);

          if (findUser !== null) {
            res.json('Username already in use')
          } else if (findEmail !== null){
            res.json('Email already in use')
          } else {
            // Create a User object with escaped and trimmed data.
            const user = new User({
              firstName: req.body.firstName,
              lastName: req.body.lastName,
              username: req.body.firstName + ' ' + req.body.lastName,
              email: req.body.email,
              password: hashedPassword,
              following: undefined,
              followers: undefined,
              iconUrl: 'https://i.pinimg.com/736x/3c/67/75/3c67757cef723535a7484a6c7bfbfc43.jpg',
              followRequests: undefined,
            });
        
            if (!errors.isEmpty()) {
              // There are errors. Render form again with sanitized values/error messages.
        
              res.json({
                title: "Sign Up Error",
                user: user,
                errors: errors.array(),
              });
            } else {
              // Data from form is valid. Save user.
              await user.save();
              res.json("user created");
            }
          }
        })
      })
];

exports.friends = asyncHandler(async (req, res, next) => {
  try {
    let user = undefined;
  
    jwt.verify(req.token, `${process.env.JWT_KEY}`, async (err, authData) => {
      if(err) {
        return res.status(401).json('Login required');
      } else {
        user = authData.user;

        const [updatedUser, pendingRequests] = await Promise.all([
          User.findById(user._id).populate("following").populate("followers").populate("followRequests").exec(),
          User.find({ followRequests: user._id }).exec(),
        ]);

        const followRequestsNames = [...new Set(updatedUser.followRequests.map(data => data.username))];
        const followingNames = [...new Set(updatedUser.following.map(data => ({username: data.username, iconUrl: data.iconUrl})))];
        const followerNames = [...new Set(updatedUser.followers.map(data => ({username: data.username, iconUrl: data.iconUrl})))];
        const pendingRequestsNames = [...new Set(pendingRequests.map(data => data.username))];

        res.json({
          title: "Posts",
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          username: updatedUser.username,
          iconUrl: updatedUser.iconUrl,
          followingNames: followingNames,
          followerNames: followerNames,
          followRequestsNames: followRequestsNames,
          pendingRequestsNames: pendingRequestsNames,
        });
      }
    });
  } catch (error) {
    console.error('Error retrieving posts:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

exports.addFriend_post = [
  // Validate and sanitize fields.
  body("username", "Please type a username to add")
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

      const findUser = await User.findOne({ username: req.body.username }).exec();
      
      if (findUser === null) {
        res.json('User not found')
      } else {
        console.log(authData.user.username)
        // Create a Post object with escaped and trimmed data.
        const user = new User({
          following: findUser.following,
          followers: findUser.followers,
          firstName: findUser.firstName,
          lastName: findUser.lastName,
          username: findUser.username,
          email: findUser.email,
          password: findUser.password,
          iconUrl: findUser.iconUrl,
          posts: findUser.posts,
          followRequests: [...findUser.followRequests, authData.user._id],
          _id: findUser._id,
        });
    
        if (!errors.isEmpty()) {
          // There are errors. Render form again with sanitized values/error messages.
          res.json({
            title: "Add Friend Error",
            errors: errors.array(),
          });
        } else {
          console.log(user)
          // Data from form is valid. Send follow request.
          await User.findByIdAndUpdate(findUser._id, user, {});
          // Redirect to book detail page.
          res.json(`Follow Request Sent`)
        }
      }
    }
  })
  })
];

exports.acceptFriend_post = [

  asyncHandler(async (req, res, next) => {
    jwt.verify(req.token, `${process.env.JWT_KEY}`,async (err, authData) => {
      if(err) {
        res.json('Login required')
      } else {
      // Extract the validation errors from a request.
      const errors = validationResult(req);
      
      const [findUser, thisUser] = await Promise.all([
        User.findOne({ username: req.body.username }).exec(),
        User.findOne({ username: authData.user.username }).exec(),
      ]);

      if (findUser === null) {
        res.json('User not found')
      } else {


        const user = new User({
          following: thisUser.following,
          followers: [...thisUser.followers, findUser._id],
          firstName: thisUser.firstName,
          lastName: thisUser.lastName,
          username: thisUser.username,
          email: thisUser.email,
          password: thisUser.password,
          iconUrl: thisUser.iconUrl,
          posts: thisUser.posts,
          followRequests: thisUser.followRequests.filter(id => id === findUser._id),
          _id: thisUser._id,
        });

        const user2 = new User({
          following: [...findUser.following, thisUser._id],
          followers: findUser.followers,
          firstName: findUser.firstName,
          lastName: findUser.lastName,
          username: findUser.username,
          email: findUser.email,
          password: findUser.password,
          iconUrl: findUser.iconUrl,
          posts: findUser.posts,
          followRequests: findUser.followRequests,
          _id: findUser._id,
        });
    
        if (!errors.isEmpty()) {
          // There are errors. Render form again with sanitized values/error messages.
          res.json({
            title: "Add Friend Error",
            errors: errors.array(),
          });
        } else {
          console.log(user)
          // Data from form is valid. Send follow request.
          await User.findByIdAndUpdate(thisUser._id, user, {});
          await User.findByIdAndUpdate(findUser._id, user2, {});
          // Redirect to book detail page.
          res.json(`Follow Request Accepted`)
        }
      }
    }
  })
  })
];

exports.editIcon_post = [

  asyncHandler(async (req, res, next) => {
    jwt.verify(req.token, `${process.env.JWT_KEY}`,async (err, authData) => {
      if(err) {
        res.json('Login required')
      } else {
      // Extract the validation errors from a request.
      const errors = validationResult(req);

      const findUser = await User.findOne({ _id: authData.user._id }).exec();
      
      if (findUser === null) {
        res.json('User not found')
      } else {
        console.log(authData.user.username)
        // Create a User object with escaped and trimmed data.
        const user = new User({
          following: findUser.following,
          followers: findUser.followers,
          firstName: findUser.firstName,
          lastName: findUser.lastName,
          username: findUser.username,
          email: findUser.email,
          password: findUser.password,
          iconUrl: req.body.imgUrl,
          posts: findUser.posts,
          followRequests: findUser.followRequests,
          _id: findUser._id,
        });
    
        if (!errors.isEmpty()) {
          // There are errors. Render form again with sanitized values/error messages.
          res.json({
            title: "Edit Profile Picture Error",
            errors: errors.array(),
          });
        } else {
          console.log(user)
          // Data from form is valid. Change profile picture.
          await User.findByIdAndUpdate(findUser._id, user, {});
          // Redirect to book detail page.
          res.json(`Profile Picture Changed`)
        }
      }
    }
  })
  })
];