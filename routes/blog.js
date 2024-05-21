const express = require("express");
const router = express.Router();

// Require controller modules.
const comment_controller = require("../controllers/commentController");
const post_controller = require("../controllers/postController");
const user_controller = require("../controllers/userController");
const like_controller = require("../controllers/likeController");

router.get("/posts", verifyToken, post_controller.posts);

router.get("/profilePosts", verifyToken, post_controller.profilePosts);

router.post("/post", verifyToken, post_controller.post_post);

router.post("/post/:id/update", verifyToken, post_controller.update_post);

router.post("/post/:id/delete", verifyToken, post_controller.delete_post);

router.get("/post/:id", post_controller.post_detail);

router.get("/login", user_controller.login);

router.get("/signUp", user_controller.signUp);

router.post("/signUp", user_controller.signUp_post);

router.get("/friends", verifyToken, user_controller.friends);

router.post("/addFriend", verifyToken, user_controller.addFriend_post);

router.post("/acceptFriend", verifyToken, user_controller.acceptFriend_post);

router.post("/editIcon", verifyToken, user_controller.editIcon_post);

router.post("/comment/:id", verifyToken, comment_controller.comment_create_post);

router.post("/comment/:id/delete", verifyToken, comment_controller.comment_delete_post);

router.post("/like/:id", verifyToken, like_controller.like_post);

// Verify Token
function verifyToken(req, res, next) {
    // Get auth header value 
    const bearerHeader = req.headers['authorization'];
    // Check if bearer is undefined
    if(typeof bearerHeader !== 'undefined') {
        const bearer = bearerHeader.split(' ');
        const bearerToken = bearer[1];
        req.token = bearerToken;
        next();
    } else {
        // Forbidden
        res.json('Login required')
    }
}

module.exports = router;