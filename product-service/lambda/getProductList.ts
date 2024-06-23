import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const documentClient = DynamoDBDocumentClient.from(client);

export const handler = async () => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Credentials': true,
        'Access-Control-Allow-Methods': '*',
        'Content-Type': 'application/json',
    };

    try {
        const { Items: productsData } = await documentClient.send(new ScanCommand({ TableName: process.env.DB_PRODUCTS }));
        const { Items: stocksData} = await documentClient.send(new ScanCommand({ TableName: process.env.DB_STOCK }));

        if (!productsData || !productsData.length) {
            throw new Error('No data to display');
        }

        const fullData = productsData?.map((product) => ({
          ...product,
          count: stocksData?.find(({ product_id }) => product_id === product.id)?.count,
        }));

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
