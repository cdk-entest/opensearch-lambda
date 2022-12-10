import { App } from "aws-cdk-lib";
import {
  DDBStreamStack,
  OpensearchLambdaStack,
} from "../lib/opensearch-lambda-stack";

const app = new App();

// openearch stach
new OpensearchLambdaStack(app, "OpensearchLambdaStack", {
  opensearchDomain: "",
});

// dynamodb stream trigger lambda
new DDBStreamStack(app, "DDBStreamStack", {
  openSearchDomain: "",
  tableArn: "",
  tableStreamArn: "",
});
