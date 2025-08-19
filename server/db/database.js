// server/db/database.js
import dotenv from "dotenv";
dotenv.config();

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
export const ddb = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

// keep same exports to avoid editing routes
import { User } from "./user.js";
import { Config } from "./config.js";
export { User, Config };
