import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const client = new S3Client({});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log("Incoming request:", event);

    const { queryStringParameters } = event;

    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Credentials': true,
        'Access-Control-Allow-Methods': '*',
        'Content-Type': 'text/plain',
    };

    const name = queryStringParameters?.name;

    if (!name) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: "File should be named." }),
        };
    }

    const command = new PutObjectCommand({
        Bucket: process.env.BUCKET!,
        Key: `uploaded/${name}`,
        ContentType: 'text/csv',
    });

    try {
        const signedUrl = await getSignedUrl(client, command, { expiresIn: 300 });

        return {
            statusCode: 200,
            headers,
            body: signedUrl,
        };

    } catch (error) {
        console.error("Error during getting signed URL from S3:", error);

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: "Internal Server Error" })
        };
    }
};