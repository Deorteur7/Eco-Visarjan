// DynamoDB-backed store (AWS DynamoDB, or DynamoDB Local if DYNAMODB_ENDPOINT is set).
import {
  CreateTableCommand,
  DescribeTableCommand,
  DynamoDBClient,
  ResourceNotFoundException,
  waitUntilTableExists,
} from '@aws-sdk/client-dynamodb';
import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { config } from '../config/index.js';
import { TABLES, TABLE_KEYS } from './tables.js';

const BATCH_SIZE = 25;
const MAX_RETRIES = 5;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function createDynamoStore() {
  const { region, endpoint } = config.aws;
  const client = new DynamoDBClient({
    region,
    ...(endpoint
      ? {
          endpoint,
          // DynamoDB Local accepts any credentials.
          credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
        }
      : {}),
  });
  const doc = DynamoDBDocumentClient.from(client, {
    marshallOptions: { removeUndefinedValues: true },
  });

  const tableName = (key) => {
    const name = TABLES[key];
    if (!name) throw new Error(`Unknown table key: ${key}`);
    return name;
  };

  async function tableExists(name) {
    try {
      await client.send(new DescribeTableCommand({ TableName: name }));
      return true;
    } catch (error) {
      if (error instanceof ResourceNotFoundException) return false;
      throw error;
    }
  }

  async function ensureTables() {
    for (const key of TABLE_KEYS) {
      const name = tableName(key);
      if (await tableExists(name)) continue;
      await client.send(
        new CreateTableCommand({
          TableName: name,
          BillingMode: 'PAY_PER_REQUEST',
          AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
          KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
        }),
      );
      await waitUntilTableExists({ client, maxWaitTime: 60 }, { TableName: name });
    }
  }

  async function list(key) {
    const items = [];
    let startKey;
    do {
      const page = await doc.send(
        new ScanCommand({ TableName: tableName(key), ExclusiveStartKey: startKey }),
      );
      items.push(...(page.Items ?? []));
      startKey = page.LastEvaluatedKey;
    } while (startKey);
    return items;
  }

  async function get(key, id) {
    const result = await doc.send(new GetCommand({ TableName: tableName(key), Key: { id } }));
    return result.Item ?? null;
  }

  async function put(key, item) {
    await doc.send(new PutCommand({ TableName: tableName(key), Item: item }));
  }

  async function putMany(key, items) {
    const name = tableName(key);
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      let pending = items
        .slice(i, i + BATCH_SIZE)
        .map((Item) => ({ PutRequest: { Item } }));
      let attempt = 0;
      while (pending.length > 0) {
        const result = await doc.send(
          new BatchWriteCommand({ RequestItems: { [name]: pending } }),
        );
        pending = result.UnprocessedItems?.[name] ?? [];
        if (pending.length > 0) {
          attempt += 1;
          if (attempt > MAX_RETRIES) {
            throw new Error(`DynamoDB batch write to ${name} left unprocessed items.`);
          }
          await sleep(100 * 2 ** attempt);
        }
      }
    }
  }

  async function count(key) {
    let total = 0;
    let startKey;
    do {
      const page = await doc.send(
        new ScanCommand({
          TableName: tableName(key),
          Select: 'COUNT',
          ExclusiveStartKey: startKey,
        }),
      );
      total += page.Count ?? 0;
      startKey = page.LastEvaluatedKey;
    } while (startKey);
    return total;
  }

  async function health() {
    try {
      const results = await Promise.all(TABLE_KEYS.map((key) => tableExists(tableName(key))));
      const missing = TABLE_KEYS.filter((_, index) => !results[index]).map(tableName);
      return { ok: missing.length === 0, kind: 'dynamodb', region, endpoint: endpoint || null, missing };
    } catch (error) {
      return { ok: false, kind: 'dynamodb', region, error: error.name };
    }
  }

  return { kind: 'dynamodb', ensureTables, list, get, put, putMany, count, health };
}
