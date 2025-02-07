import mongoose from "mongoose";

const DataSchema = new mongoose.Schema({
    configType: {
        type: String,
        required: true,
    },
    configData: {
        type: Object,
        required: false,
    }
});

const DataModel = mongoose.model("config", DataSchema);

export { DataModel as Config };
