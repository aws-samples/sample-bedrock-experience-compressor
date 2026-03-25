import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class S3Stack extends cdk.Stack {
  public readonly runbooksBucket: s3.Bucket;
  public readonly reportsBucket: s3.Bucket;
  public readonly photosBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.runbooksBucket = new s3.Bucket(this, 'Runbooks', {
      bucketName: `xp-compressor-runbooks-${this.account}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      enforceSSL: true,
      cors: [{
        allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.HEAD],
        allowedOrigins: [
          `https://*.cloudfront.net`,
          'http://localhost:5173',
        ],
        allowedHeaders: ['content-type', 'authorization', 'x-amz-date', 'x-amz-security-token'],
        maxAge: 3000,
      }],
    });

    this.reportsBucket = new s3.Bucket(this, 'Reports', {
      bucketName: `xp-compressor-reports-${this.account}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
    });

    this.photosBucket = new s3.Bucket(this, 'Photos', {
      bucketName: `xp-compressor-photos-${this.account}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      cors: [{
        allowedMethods: [s3.HttpMethods.PUT, s3.HttpMethods.GET, s3.HttpMethods.HEAD],
        allowedOrigins: [
          `https://*.cloudfront.net`,
          'http://localhost:5173',
        ],
        allowedHeaders: ['content-type', 'authorization', 'x-amz-date', 'x-amz-security-token'],
        maxAge: 3000,
      }],
    });

    new cdk.CfnOutput(this, 'RunbooksBucketName', { value: this.runbooksBucket.bucketName });
    new cdk.CfnOutput(this, 'ReportsBucketName', { value: this.reportsBucket.bucketName });
    new cdk.CfnOutput(this, 'PhotosBucketName', { value: this.photosBucket.bucketName });
  }
}
