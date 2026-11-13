
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
const projectRoutes = require("./routes/project");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/projects", projectRoutes);

// Home route
app.get("/", (req, res) => {
    res.send("Blueprint Designer Backend is Running!");
});

// Health check
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Backend is working!",
        database: mongoose.connection.readyState === 1
            ? "Connected"
            : "Disconnected"
    });
});

// Connect to MongoDB
const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected successfully!");

        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
    }
}

startServer();
