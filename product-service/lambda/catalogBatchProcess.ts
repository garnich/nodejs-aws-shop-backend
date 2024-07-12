import {
    TransactWriteItem,
    TransactWriteItemsCommand
  } from "@aws-sdk/client-dynamodb";
  import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
  import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
  import { SQSEvent } from "aws-lambda";
  import { v4 as uuid } from 'uuid';
  import { IProduct, ICount, IProductWithCount } from '../types';
  import { marshall } from "@aws-sdk/util-dynamodb";
  import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";  
  
  const PRODUCTS_TABLE = process.env.DB_PRODUCTS ?? "";
  const STOCKS_TABLE = process.env.DB_STOCK ?? "";
  const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN || "";
  
  const client = new DynamoDBClient({});
  const documentClient = DynamoDBDocumentClient.from(client);
  const snsClient = new SNSClient({});

  
  export async function handler(event: SQSEvent) {
    console.log("Catalog Batch Process handler incoming request", event);
    const transactItems: TransactWriteItem[] = [];
    const itemsToSNS: IProductWithCount[] = [];

    try {
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

        const SNSItem: IProductWithCount = { ...newProduct, count: newStock.count };
        itemsToSNS.push(SNSItem);
  
        transactItems.push(putProduct, putStock);
      }
  
      const command = new TransactWriteItemsCommand({
        TransactItems: transactItems,
      });
  
      await documentClient.send(command);

      await snsClient.send(
        new PublishCommand({
          Subject: "Added new product|s!",
          TopicArn: SNS_TOPIC_ARN,
          Message: JSON.stringify({
            message: "New product|s was added to the DB",
            products: itemsToSNS,
            count: itemsToSNS.length,
          }),
        })
      );
  
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