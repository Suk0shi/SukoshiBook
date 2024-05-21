const bcrypt = require("bcryptjs");

// Get arguments passed on command line
const userArgs = process.argv.slice(2);
  
const User = require("./models/user");

let password = undefined;

bcrypt.hash('supersecretpassword', 10, async (err, hashedPassword) => {
  password = hashedPassword;
})

const users = [];

const mongoose = require("mongoose");
mongoose.set("strictQuery", false);

const mongoDB = userArgs[0];

main().catch((err) => console.log(err));

async function main() {
  console.log("Debug: About to connect");
  await mongoose.connect(mongoDB);
  console.log("Debug: Should be connected?");
  await createUsers();
  console.log("Debug: Closing mongoose");
  mongoose.connection.close();
}

async function userCreate(index, username, password) {
  
  
    userdetail = {
      username: username,
      password: password,
    };
   
    const user = new User(userdetail);
    await user.save();
    users[index] = user;
    console.log(`Added user: ${username}`);
  
}

  async function createUsers() {
    console.log("Adding users");
    await Promise.all([
      userCreate(0, "tini", password),
    ]);
  }