import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  Function,
  Runtime,
  Code,
} from "aws-cdk-lib/aws-lambda";
import 'dotenv/config';

export class AuthorizationServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new Function(
      this,
      "BasicAuthorizerHandler",
      {
        runtime: Runtime.NODEJS_20_X,
        code: Code.fromAsset('lambda'),
        handler: "basicAuthorization.handler",
        environment: {
          garnich: process.env.garnich!,
        }
      },
    );
  }
}
