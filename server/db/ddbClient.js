// server/db/ddbClient.js
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// load .env deterministically (root or server/.env — pick one)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: path.resolve(process.cwd(), ".env") }); // root .env
// or: dotenv.config({ path: path.join(__dirname, "../.env") }); // server/.env

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

if (!process.env.AWS_REGION) console.warn("⚠️ AWS_REGION not set");
if (!process.env.DDB_TABLE)  console.warn("⚠️ DDB_TABLE not set");

export const TABLE = process.env.DDB_TABLE ?? (() => {
  throw new Error("DDB_TABLE env var is missing");
})();

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
export const ddb = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});
