import {
  PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { ddb, TABLE } from "./ddbClient.js";   // <-- use TABLE here

/* ... rest exactly as you have ... */

if (!TABLE) {
  throw new Error("DDB_TABLE env var is missing. Add DDB_TABLE=AppData to your .env");
}
const pkUser = (userid) => `USER#${userid}`;
const SK_PROFILE = "PROFILE";

export const User = {
  async create(doc) {
    if (!doc?.userid) throw new Error("User.create: userid is required");
    const item = {
      pk: pkUser(doc.userid), sk: SK_PROFILE,
      userid: doc.userid, firstname: doc.firstname, lastname: doc.lastname,
      email: doc.email, password: doc.password, usertype: doc.usertype,
      userData: doc.userData ?? null, decision: doc.decision, conflict: doc.conflict ?? [],
      gsi1pk: "USER#EMAIL", gsi1sk: doc.email,
      updatedAt: Date.now(), createdAt: Date.now(),
    };
    await ddb.send(new PutCommand({ TableName: TABLE, Item: item }));
    return item;
  },
  async findById(userid) {
    const { Item } = await ddb.send(new GetCommand({
      TableName: TABLE, Key: { pk: pkUser(userid), sk: SK_PROFILE },
    }));
    return Item ?? null;
  },
  async findOne(filter = {}) {
    if (filter.userid) return this.findById(filter.userid);
    if (filter.email) {
      const resp = await ddb.send(new QueryCommand({
        TableName: TABLE, IndexName: "GSI1",
        KeyConditionExpression: "gsi1pk = :p AND gsi1sk = :e",
        ExpressionAttributeValues: { ":p": "USER#EMAIL", ":e": filter.email },
        Limit: 1,
      }));
      return resp.Items?.[0] ?? null;
    }
    return null;
  },
  async updateOne(filter, update) {
    const userid = filter?.userid || filter?._id;
    if (!userid) throw new Error("User.updateOne requires { userid }");
    const sets = update?.$set ?? update ?? {};
    const names = {}, values = {}; const parts = [];
    let i = 0; for (const [k, v] of Object.entries(sets)) {
      const nk = `#k${i}`, nv = `:v${i}`; names[nk] = k; values[nv] = v; parts.push(`${nk} = ${nv}`); i++;
    }
    names["#updatedAt"] = "updatedAt"; values[":updatedAt"] = Date.now(); parts.push("#updatedAt = :updatedAt");
    await ddb.send(new UpdateCommand({
      TableName: TABLE, Key: { pk: pkUser(userid), sk: SK_PROFILE },
      UpdateExpression: `SET ${parts.join(", ")}`,
      ExpressionAttributeNames: names, ExpressionAttributeValues: values,
    }));
    return { acknowledged: true, modifiedCount: 1 };
    },
  async deleteOne(filter) {
    const userid = filter?.userid || filter?._id;
    if (!userid) throw new Error("User.deleteOne requires { userid }");
    await ddb.send(new DeleteCommand({
      TableName: TABLE, Key: { pk: pkUser(userid), sk: SK_PROFILE },
    }));
    return { acknowledged: true, deletedCount: 1 };
  },
};
