// server/db/config.js
import { PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, TABLE } from "./ddbClient.js";
/* ... use TABLE ... */

// We’ll just keep a fixed PK/SK for “the config”
const PK = "CONFIG#APP";
const SK = "CURRENT";

export const Config = {
  /**
   * findOne() ~ mongoose Model.findOne()
   * Always returns the single config object if it exists.
   */
  async findOne() {
    const { Item } = await ddb.send(new GetCommand({
      TableName: TABLE,
      Key: { pk: PK, sk: SK },
    }));
    return Item ?? null;
  },

  /**
   * create(doc) ~ mongoose Model.create()
   * Overwrites the current config with provided data.
   */
  async create(doc) {
    const item = {
      pk: PK,
      sk: SK,
      configType: doc.configType,
      configData: doc.configData ?? {},
      updatedAt: Date.now(),
    };
    await ddb.send(new PutCommand({ TableName: TABLE, Item: item }));
    return item;
  },

  /**
   * upsert(doc) ~ like findOneAndUpdate or createOrUpdate
   */
  async upsert(doc) {
    return this.create(doc); // same as create, since PutCommand overwrites
  },
};
