import * as cdk from "aws-cdk-lib";
import { Duration, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as path from "path";

interface OpenSearchLambdaProps extends StackProps {
  opensearchDomain: string;
}

export class OpensearchLambdaStack extends cdk.Stack {
  public readonly apigw: cdk.aws_apigateway.RestApi;

  constructor(scope: Construct, id: string, props: OpenSearchLambdaProps) {
    super(scope, id, props);

    // lambda function
    const func = new cdk.aws_lambda.Function(this, "TestOpenSearchLambda", {
      functionName: "TestOpenSearchLambda",
      handler: "index.handler",
      runtime: cdk.aws_lambda.Runtime.PYTHON_3_9,
      memorySize: 512,
      timeout: Duration.seconds(10),
      code: cdk.aws_lambda.Code.fromAsset(path.join(__dirname, "./../lambda")),
      environment: {
        OPENSEARCH_DOMAIN: props.opensearchDomain,
        PYTHONPATH: "/var/task/package",
        REGION: this.region,
      },
    });

    // apigateway
    this.apigw = new cdk.aws_apigateway.RestApi(this, "OpenSearchApiGwLambda", {
      restApiName: "OpenSearchApiGwLambda",
    });

    const resource = this.apigw.root.addResource("cdk-entest");

    // integrate with lambda function
    resource.addMethod("GET", new cdk.aws_apigateway.LambdaIntegration(func));
  }
}
