import {
    TransactWriteItem,
    TransactWriteItemsCommand
  } from "@aws-sdk/client-dynamodb";
  import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
  import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
  import { SQSEvent } from "aws-lambda";
  import { v4 as uuid } from 'uuid';
  import { IProduct, ICount } from '../types';
  import { marshall } from "@aws-sdk/util-dynamodb";
  
  const PRODUCTS_TABLE = process.env.DB_PRODUCTS ?? "";
  const STOCKS_TABLE = process.env.DB_STOCK ?? "";
  
  const client = new DynamoDBClient({});
  const documentClient = DynamoDBDocumentClient.from(client);
  
  export async function handler(event: SQSEvent) {
    console.log("Catalog Batch Process handler incoming request", event);
  
    try {
      const transactItems: TransactWriteItem[] = [];
      for (const message of event.Records) {

        const { title, description, price, count } =
          typeof message.body == "object"
            ? message.body
            : JSON.parse(message.body);
  
        if (!title || !description || !price || !count) {
          return {
            statusCode: 400,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET",
            },
            body: "Invalid request, product have wrong structure",
          };
        }
  
        const newProduct: IProduct = {
          id: uuid(),
          title,
          description,
          price,
        };
  
        const putProduct = {
          Put: {
            Item: marshall(newProduct),
            TableName: PRODUCTS_TABLE,
          },
        };

        const newStock: ICount = {
            product_id: newProduct.id,
            count,
          };

        const putStock = {
          Put: {
            Item: marshall(newStock),
            TableName: STOCKS_TABLE,
          },
        };
  
        transactItems.push(putProduct, putStock);
      }
  
      const command = new TransactWriteItemsCommand({
        TransactItems: transactItems,
      });
  
      await documentClient.send(command);
  
      return {
        statusCode: 201,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET",
        },
        body: "New Product created and added to DB",
      };
    } catch (error) {
      console.log("error!!!: ", error);
      return {
        statusCode: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET",
        },
        body: error,
      }
    }
  }