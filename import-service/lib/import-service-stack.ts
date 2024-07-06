import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  Function,
  Runtime,
  AssetCode,

} from "aws-cdk-lib/aws-lambda";
import {
  LambdaIntegration,
  RestApi,
  Cors,
} from "aws-cdk-lib/aws-apigateway";
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { Bucket, HttpMethods, EventType, BlockPublicAccess } from 'aws-cdk-lib/aws-s3';
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications';
import { Queue } from "aws-cdk-lib/aws-sqs";

const SQS_ARN = process.env.SQS_ARN! ?? 'arn:aws:sqs:us-west-2:111:name';

export class ImportServiceStackGarnichApp extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

      const bucket = new Bucket(this, "ProductImportBucket",
        {
      bucketName:  'garnich-import-service-bucket',
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
        cors: [
          {
            maxAge: 60 * 60,
            allowedOrigins: ['*'],
            allowedMethods: [HttpMethods.GET, HttpMethods.PUT, HttpMethods.DELETE],
            allowedHeaders: ['*'],
          },
        ],
      }
    );

      const importProductsLambda = new Function(this, 'importProductsFunction', {
        runtime: Runtime.NODEJS_20_X,
        code: new AssetCode('lambda'),
        handler: 'importProductsFile.handler',
        environment: {
          BUCKET_NAME: bucket.bucketName,
        },
      });

      const importParserLambda = new Function(this, 'ImportParserFunction', {
        runtime: Runtime.NODEJS_20_X,
        code: new AssetCode('lambda'),
        handler: 'importFileParser.handler',
        environment: {
          BUCKET_NAME: bucket.bucketName,
          SQS_URL: process.env.SQS_URL ?? '',
        },
      });

      const importProductsPolicy = new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['s3:PutObject'],
        resources: [bucket.bucketArn + '/*'],
      });

      importProductsLambda.addToRolePolicy(importProductsPolicy);
  
      const importParserPolicy = new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
        resources: [bucket.bucketArn + '/*'],
      });

      importParserLambda.addToRolePolicy(importParserPolicy);

      const api = new RestApi(this, "ImportService", {
        restApiName: "ImportService",
        cloudWatchRole: true,
        defaultCorsPreflightOptions: {
          allowOrigins: Cors.ALL_ORIGINS,
          allowMethods: Cors.ALL_METHODS,
        },
      });

    const catalogItemsQueue = Queue.fromQueueArn(
      this,
      "ImportFileQueue",
      SQS_ARN,
    );

    catalogItemsQueue.grantSendMessages(importParserLambda);

    const importResource = api.root.addResource('import');

    importResource.addMethod('GET', new LambdaIntegration(importProductsLambda));

    bucket.addEventNotification(
      EventType.OBJECT_CREATED,
      new LambdaDestination(importParserLambda),
      { prefix: 'uploaded/' }
    );
    }
};
