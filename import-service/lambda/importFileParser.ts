import { S3Client, GetObjectCommand, CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { PassThrough, Readable } from 'stream';
import csv from 'csv-parser';

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin" : "*",
};

const s3Client = new S3Client({});
const sqsClient = new SQSClient({});
const SQS_URL = process.env.SQS_URL ?? "";

export const handler = async (event: any) => {
  console.log('EVENT: ', event);

  try {
    for (const record of event.Records) {
      const bucketName = record.s3.bucket.name;
      const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

      const getAndDeleteObjectCommandParams = { Bucket: bucketName, Key: key };

      const { Body: data } = await s3Client.send(
        new GetObjectCommand(getAndDeleteObjectCommandParams)
      );

      if (!(data instanceof Readable)) {
        throw new Error('Data is not a readable stream');
      }

      await new Promise((resolve, reject) => {
        data
          .pipe(new PassThrough())
          .pipe(csv())
          .on("data", async (data: { [key: string]: string }) => {
            const command = new SendMessageCommand({
              QueueUrl: SQS_URL,
              MessageBody: JSON.stringify(data),
            });
            await sqsClient.send(command);
          })
          .on('error', (error: any) => reject(error))
          .on('end', async () => {

            const copyObjectCommandParams = {
              Bucket: bucketName,
              CopySource: `${bucketName}/${key}`,
              Key: key.replace('uploaded', 'parsed'),
            };

            console.log('COPY OBJECT COMMAND PARAMS -> ', copyObjectCommandParams);;
            await s3Client.send(
              new CopyObjectCommand(copyObjectCommandParams)
            );
            console.log('OBJECT COPIED -> DONE');
            await s3Client.send(
              new DeleteObjectCommand(getAndDeleteObjectCommandParams)
            );
            console.log('OBJECT DELETED -> DONE');

            console.log(
              'CSV file PARSED succesfully, each product sent to SQS and moved csv file from "uploaded" to "parsed" folder'
            );

            resolve(null);
          });
      });

      console.log('FILE PARSED -> DONE');
    }

    return {
      statusCode: 200,
      headers,
      body: 'File parsing: DONE.',
    };

  } catch (error) {
    console.error(error);

    return {
      statusCode: 500,
      headers,
      body: "Internal Server Error",
    };
  }
};