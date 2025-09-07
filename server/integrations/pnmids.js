// server/integrations/pnmid.js
import { PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, TABLE } from "../db/ddbClient.js";

/**
 * Atomically increments and returns the next PNM ID.
 * Uses one item in DynamoDB: { pk: "COUNTER#PNM_ID", sk: "GLOBAL", value: N }
 * - UpdateItem with ADD is atomic and creates the item if it doesn't exist.
 */
export async function getNextPnmIdAtomic() {
  const key = { pk: "COUNTER#PNM_ID", sk: "GLOBAL" };
  const resp = await ddb.send(new UpdateCommand({
    TableName: TABLE,
    Key: key,
    UpdateExpression: "ADD #v :one",
    ExpressionAttributeNames: { "#v": "value" },
    ExpressionAttributeValues: { ":one": 1 },
    ReturnValues: "UPDATED_NEW",
  }));
  // returns the incremented value
  return resp.Attributes.value;
}

/**
 * Claims an email exactly once (idempotent across concurrent requests).
 * We write an item with pk = PNM_EMAIL#<email> only if it doesn't exist.
 * Returns true if we won the claim, false if someone else already claimed.
 */
export async function claimPnmEmailOnce(email) {
  const key = { pk: `PNM_EMAIL#${email}`, sk: "CLAIM" };
  try {
    await ddb.send(new PutCommand({
      TableName: TABLE,
      Item: { ...key, createdAt: Date.now() },
      ConditionExpression: "attribute_not_exists(pk)",
    }));
    return true;
  } catch (e) {
    // ConditionalCheckFailedException -> another request already wrote it
    if (e.name === "ConditionalCheckFailedException") return false;
    throw e;
  }
}
