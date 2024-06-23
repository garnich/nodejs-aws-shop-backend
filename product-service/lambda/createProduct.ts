import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuid } from 'uuid';

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

const client = new DynamoDBClient({});
const documentClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: any) => {
    console.log('createProuct event: ', event);

  try {
    const body = JSON.parse(event.body || "{}");
    const { title, description, price, count } = body;

    if (typeof body?.title === 'string' || typeof body?.description === 'string' || typeof body?.price === 'number' || typeof body?.count === 'number') {
        return {
          statusCode: 400,
          headers,
          body: 'Validation Error request should contain title, description as [string] and price, count as [number]',
        };
      }

    const id = uuid();

    await documentClient.send(new TransactWriteCommand({
        TransactItems: [
            {
                Put: {
                    TableName: process.env.DB_PRODUCTS,
                    Item: { id, title, description, price },
                }
            },
            {
                Put: {
                    TableName: process.env.DB_STOCK,
                    Item: { product_id: id, count },
                }
            }
        ]
      }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(`Product: ${id} CREATED!`),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      headers,
      body: `Not able to create NEW item. Something went wrong: Error ${error}`,
    };
  }
};