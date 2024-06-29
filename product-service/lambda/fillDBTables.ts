import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, BatchWriteCommand } from "@aws-sdk/lib-dynamodb";
import { fillStockData } from "./fillDbhelper";
import { products } from './products';

const client = new DynamoDBClient({});
const documentClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: any) => {
  try {
    const productsTableName = process.env.DB_PRODUCTS;

    if (!productsTableName) {
      throw new Error('Please definde <DB_PRODUCTS>!');
    }

    const fillProductsTable = new BatchWriteCommand({
      RequestItems: {
        [productsTableName]: products.map((item) => ({
          PutRequest: { Item: item },
        })),
      },
    });

    const productsTableResponse = await documentClient.send(fillProductsTable);

    const stocksTableName = process.env.DB_STOCK;

    if (!stocksTableName) {
      throw new Error('Please definde <DB_STOCK>!');
    }

    const fillStockTable = new BatchWriteCommand({
      RequestItems: {
        [stocksTableName]: fillStockData(products).map((item) => ({
          PutRequest: { Item: item },
        })),
      },
    });
    const stocksTableResponse = await documentClient.send(fillStockTable);
    console.log("!!!!!!!!!!!stocksTableResponse", stocksTableResponse);

  } catch (error) {
    console.error(error);
  }
};