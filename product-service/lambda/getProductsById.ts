import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const documentClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: any) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Credentials': true,
        'Access-Control-Allow-Methods': '*',
        'Content-Type': 'application/json',
    };

    const productId = event.pathParameters.id;

    const productsTableParams = {
        TableName: process.env.DB_PRODUCTS,
        Key: {
          id: productId,
        },
      };

    try {
        const { Item: product } = await documentClient.send(new GetCommand(productsTableParams));

        if (!product) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify(
                    `NOT found. Product with id ${productId} does not exist.`
                ),
            };
        }
  
        const stocksTableParams = {
            TableName: process.env.DB_STOCK,
            Key: {
                product_id: productId,
            },
        };
        const { Item: stock } = await documentClient.send(new GetCommand(stocksTableParams));

        const fullData = { ...product, count: stock?.count ? stock?.count : 0 };

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(fullData),
        };
    } catch (error: any) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify(error.message),
        };
    }
};
