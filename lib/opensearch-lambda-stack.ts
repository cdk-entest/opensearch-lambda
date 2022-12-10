import * as cdk from "aws-cdk-lib";
import { Duration, Stack, StackProps } from "aws-cdk-lib";
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
      handler: "lambda_query_os.handler",
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

interface DDBStreamProps extends StackProps {
  openSearchDomain: string;
  tableArn: string;
  tableStreamArn: string;
}

export class DDBStreamStack extends Stack {
  constructor(scope: Construct, id: string, props: DDBStreamProps) {
    super(scope, id, props);

    // role for lambda to read opensearch
    // need to configure from opensearch side
    const role = new cdk.aws_iam.Role(this, "RoleForLambdaIndexOpenSearch", {
      roleName: "RoleForLambdaIndexOpenSearch",
      assumedBy: new cdk.aws_iam.ServicePrincipal("lambda.amazonaws.com"),
    });

    //  lambda function
    const func = new cdk.aws_lambda.Function(this, "LambdaIndexOpenSearch", {
      functionName: "LambdaIndexOpenSearch",
      memorySize: 512,
      timeout: Duration.seconds(10),
      code: cdk.aws_lambda.Code.fromAsset("./../lambda"),
      handler: "lambda_index_os.handler",
      runtime: cdk.aws_lambda.Runtime.PYTHON_3_9,
      role: role,
      environment: {
        OPENSEARCH_DOMAIN: props.openSearchDomain,
        PYTHONPATH: "/var/task/package",
        REGION: this.region,
      },
    });

    // existing ddb table
    const table = cdk.aws_dynamodb.Table.fromTableAttributes(
      this,
      "NoteTableStream",
      {
        tableArn: props.tableArn,
        tableStreamArn: props.tableStreamArn,
      }
    );

    // configure ddb stream to trigger lambda
    func.addEventSource(
      new cdk.aws_lambda_event_sources.DynamoEventSource(table, {
        startingPosition: cdk.aws_lambda.StartingPosition.LATEST,
        batchSize: 5,
        maxBatchingWindow: Duration.seconds(1),
        bisectBatchOnError: true,
        retryAttempts: 2,
        enabled: true,
      })
    );
  }
}
