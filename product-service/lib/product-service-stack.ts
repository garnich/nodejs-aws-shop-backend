import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  Function,
  Runtime,
  Code,
} from "aws-cdk-lib/aws-lambda";
import {
  LambdaIntegration,
  RestApi,
  Cors,
} from "aws-cdk-lib/aws-apigateway";
import { Table, AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import { EmailSubscription } from "aws-cdk-lib/aws-sns-subscriptions";
import { Queue } from "aws-cdk-lib/aws-sqs";
import { FilterOrPolicy, SubscriptionFilter, Topic } from "aws-cdk-lib/aws-sns";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";

export class ProductServiceStackGarnichApp extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const productsTable = new Table(
      this,
      'Products', {
      partitionKey: { name: 'title', type: AttributeType.STRING },
      tableName: process.env.DB_PRODUCTS,
    });

    const stocksTable = new Table(
      this,
      'Stock', {
      partitionKey: { name: 'product_id', type: AttributeType.STRING },
      tableName: process.env.DB_STOCK,
    });

    const getProductsList = new Function(
      this,
      "GetProductsListHandler",
      {
        runtime: Runtime.NODEJS_20_X,
        code: Code.fromAsset('lambda'),
        handler: "getProductList.handler",
      }
    );

    const getProductById = new Function(
      this,
      "GetProductByIdHandler",
      {
        runtime: Runtime.NODEJS_20_X,
        code: Code.fromAsset('lambda'),
        handler: "getProductsById.handler",
      }
    );

    const fillTablesLambda = new Function(
      this,
      "FillTablesLambda", {
      runtime: Runtime.NODEJS_20_X,
      code: Code.fromAsset('lambda'),
      handler: 'fillDBTables.handler',
      environment: {
        PRODUCTS_TABLE: productsTable.tableName,
        STOCKS_TABLE: stocksTable.tableName,
      }
    });

    const createProduct = new Function(this, 'CreateProductHandler', {
      runtime: Runtime.NODEJS_20_X,
      code: Code.fromAsset('lambda'),
      handler: 'createProduct.handler',
      environment: {
        PRODUCTS_TABLE: productsTable.tableName,
      }
    });

    const catalogBatchProcess = new Function(
      this,
      "CatalogBatchProcessLambda", {
      runtime: Runtime.NODEJS_20_X,
      code: Code.fromAsset('lambda'),
      handler: 'catalogBatchProcess.handler',
      environment: {
        PRODUCTS_TABLE: productsTable.tableName,
        STOCKS_TABLE: stocksTable.tableName,
      }
    });

    const catalogItemsQueue = new Queue(this, "catalogItemsQueue", {
      queueName: "catalogItemsQueue",
    });

    catalogItemsQueue.grantConsumeMessages(catalogBatchProcess);

    catalogBatchProcess.addEventSource(
      new SqsEventSource(catalogItemsQueue, {
        batchSize: 5,
      })
    );


    const createProductTopic = new Topic(this, "createProductTopic", {
      topicName: "createProductTopic",
    });

    createProductTopic.addSubscription(
      new EmailSubscription(process.env.EMAIL1 ?? 'garnich5092301@gmail.com', {
        filterPolicyWithMessageBody: {
          count: FilterOrPolicy.filter(
            SubscriptionFilter.numericFilter({ greaterThanOrEqualTo: 3 })
          ),
        },
      })
    );

    createProductTopic.addSubscription(
      new EmailSubscription(process.env.EMAIL2 ?? 'garnich@tut.by', {
        filterPolicyWithMessageBody: {
          count: FilterOrPolicy.filter(
            SubscriptionFilter.numericFilter({ lessThan: 3 })
          ),
        },
      })
    );

    createProductTopic.grantPublish(catalogBatchProcess);

    productsTable.grantReadWriteData(fillTablesLambda);
    stocksTable.grantReadWriteData(fillTablesLambda);
    productsTable.grantReadWriteData(createProduct);

    const api = new RestApi(this, "ProductService", {
      restApiName: "ProductService",
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
      },
    });

    const productsPath = api.root.addResource("products");

    productsPath.addMethod("GET", new LambdaIntegration(getProductsList));

    const productByIdPath = productsPath.addResource("{id}");

    productByIdPath.addMethod("GET", new LambdaIntegration(getProductById));

    productsPath.addMethod('POST', new LambdaIntegration(createProduct));
  }
}
