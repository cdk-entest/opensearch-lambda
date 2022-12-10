import {
  aws_cloudfront,
  aws_cloudfront_origins,
  aws_iam,
  aws_s3,
  aws_s3_deployment,
  Duration,
  RemovalPolicy,
  Stack,
  StackProps,
} from "aws-cdk-lib";
import { Construct } from "constructs";

interface CloudFrontStackProps extends StackProps {
  bucketName: string;
  disPath: string;
}

export class CloudFrontStack extends Stack {
  constructor(scope: Construct, id: string, props: CloudFrontStackProps) {
    super(scope, id, props);

    // create a s3 bucket
    const bucket = new aws_s3.Bucket(this, "BucketForVideos", {
      bucketName: "cdk-entest-videos",
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      publicReadAccess: false,
      blockPublicAccess: aws_s3.BlockPublicAccess.BLOCK_ALL,
    });

    // create OAI
    const oai = new aws_cloudfront.OriginAccessIdentity(this, "CloudFrtonOAI", {
      comment: "OAI for cloudfront video distribution",
    });

    // grant s3 access to the OAI
    bucket.addToResourcePolicy(
      new aws_iam.PolicyStatement({
        actions: ["s3:GetObject"],
        resources: [bucket.arnForObjects("*")],
        principals: [
          new aws_iam.CanonicalUserPrincipal(
            oai.cloudFrontOriginAccessIdentityS3CanonicalUserId
          ),
        ],
      })
    );

    // cloudfront distribution
    const distribution = new aws_cloudfront.Distribution(
      this,
      "DistributionVideos",
      {
        defaultBehavior: {
          origin: new aws_cloudfront_origins.S3Origin(bucket, {
            originAccessIdentity: oai,
          }),
        },
        defaultRootObject: "index.html",
        errorResponses: [
          {
            httpStatus: 403,
            responsePagePath: "/index.html",
            ttl: Duration.seconds(300),
            responseHttpStatus: 200,
          },
        ],
      }
    );

    // deploy a static web to
    new aws_s3_deployment.BucketDeployment(this, "DeployWebsite", {
      sources: [aws_s3_deployment.Source.asset(props.disPath)],
      destinationBucket: bucket,
      distribution: distribution,
    });
  }
}
