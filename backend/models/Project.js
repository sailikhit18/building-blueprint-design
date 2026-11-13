
const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
    {
        projectName: {
            type: String,
            required: true
        },
        description: {
            type: String,
            default: ""
        },
        userId: {
            type: String,
            default: "guest"
        },
        requirements: {
            type: Object,
            default: {}
        },
        blueprint: {
            type: Object,
            default: {}
        },
        validationResults: {
            type: Array,
            default: []
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);
