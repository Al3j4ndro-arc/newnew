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
      // ⬇️ keep optional auth/profile fields
      headshotUrl: doc.headshotUrl ?? null,
      googleId: doc.googleId ?? null,
      internalHeadshotUrl: doc.internalHeadshotUrl ?? null,
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
    if (!Object.keys(sets).length) {
      return { acknowledged: true, modifiedCount: 0 };
    }
    const names = {}, values = {};
    const parts = [];
    let i = 0;

    const entries = Object.entries(sets).filter(([, v]) => v !== undefined);
    for (const [k, v] of entries) {
      const path = k.split('.').map((seg, j) => {
        const nk = `#k${i}_${j}`;
        names[nk] = seg;
        return nk;
      }).join('.');
      const nv = `:v${i}`;
      values[nv] = v;
      parts.push(`${path} = ${nv}`);
      i++;
    }

    names["#updatedAt"] = "updatedAt";
    values[":updatedAt"] = Date.now();
    parts.push("#updatedAt = :updatedAt");
    await ddb.send(new UpdateCommand({
      TableName: TABLE,
      Key: { pk: pkUser(userid), sk: SK_PROFILE },
      UpdateExpression: `SET ${parts.join(", ")}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: "UPDATED_NEW", // optional
    }));
    return { acknowledged: true, modifiedCount: 1 };
    },
    // --- add: simple wrapper used by auth.js
  async update(filter, sets) {
    // supports both (filter, {$set:{...}}) and (filter, {...})
    const u = sets?.$set ? sets : { $set: sets };
    return this.updateOne(filter, u);
  },
  // --- add: mongoose-style alias (auth.js checks for this)
  async findOneAndUpdate(filter, update, opts = {}) {
    await this.updateOne(filter, update);
    // return updated doc when requested (new / returnDocument: "after")
    if (opts.new === true || opts.returnDocument === "after") {
      return this.findOne(filter);
    }
    return null;
  },
  // --- add: full overwrite/upsert (auth.js last fallback)
  async put(item) {
    if (!item?.userid) throw new Error("User.put requires userid");
    const full = {
      ...item,
      pk: pkUser(item.userid),
      sk: SK_PROFILE,
      updatedAt: Date.now(),
      createdAt: item.createdAt ?? Date.now(),
    };
    await ddb.send(new PutCommand({ TableName: TABLE, Item: full }));
    return full;
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
