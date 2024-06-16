import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NodejsFunction, NodejsFunctionProps } from "aws-cdk-lib/aws-lambda-nodejs";

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
  }
}
