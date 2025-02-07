import mongoose from "mongoose";

const DataSchema = new mongoose.Schema({
    userid: {
        type: String,
        required: true,
    },
    firstname: {
        type: String,
        required: true,
    },
    lastname: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    usertype: {
        type: String,
        required: true,
    },
    userData: {
        type: Object,
        required: false,
    },
    decision: {
        type: String,
        required: true,
    },
    conflict: {
        type: Array,
        required: true
    }
});

const DataModel = mongoose.model("user", DataSchema);

export { DataModel as User };
