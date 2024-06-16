import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NodejsFunction, NodejsFunctionProps } from "aws-cdk-lib/aws-lambda-nodejs";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

  
    const commonProps: Partial<NodejsFunctionProps> =  {
      runtime: cdk.aws_lambda.Runtime.NODEJS_20_X,
      environment: {
        PRODUCT_AWS_REGION: process.env.REGION!,
      }
    }

    const getProductsList = new NodejsFunction(this, 'GetProductsListLambda', {
      ...commonProps,
      entry: 'handlers/getProductsList.ts',
      functionName: 'getProductsList',
    });

    const getProductById = new NodejsFunction(this, 'GetProductByIdLambda', {
      ...commonProps,
      entry: 'handlers/getProductById.ts',
      functionName: 'getProductById',
    });

    const apiGateway = new cdk.aws_apigatewayv2.HttpApi(this, 'GetProductsListApi', {
      apiName: 'GetProductsListApi',
      corsPreflight: {
        allowHeaders: ['*'],
        allowOrigins: ['*'],
        allowMethods: [cdk.aws_apigatewayv2.CorsHttpMethod.GET],
      }
    });

    apiGateway.addRoutes({
      path: '/products',
      methods: [cdk.aws_apigatewayv2.HttpMethod.GET],
      integration: new HttpLambdaIntegration('GetProductsListIntegration', getProductsList),
    });

    apiGateway.addRoutes({
      path: '/products/{productId}',
      methods: [cdk.aws_apigatewayv2.HttpMethod.GET],
      integration: new HttpLambdaIntegration('GetProductByIdIntegration', getProductById),
    });
  }
}
