import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { OpensearchLambdaStack } from "../lib/opensearch-lambda-stack";

const app = new cdk.App();
new OpensearchLambdaStack(app, "OpensearchLambdaStack", {
  opensearchDomain:
    "search-cdk-entest-kiz3iikljqbmqwizwhi675re4q.us-east-1.es.amazonaws.com",
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: "us-east-1",
  },
});
