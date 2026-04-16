const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const dropIndex = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");
    const collection = mongoose.connection.collection("users");
    await collection.dropIndex("email_1");
    console.log("Successfully dropped the unique email index!");
    process.exit(0);
  } catch (err) {
    console.error("Error dropping index (it may not exist anymore):", err.message);
    process.exit(0);
  }
};

dropIndex();
