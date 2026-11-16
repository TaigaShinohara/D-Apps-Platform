const ref = (name) => ({ Ref: name });
const sub = (value) => ({ 'Fn::Sub': value });
const att = (name, attribute) => ({ 'Fn::GetAtt': [name, attribute] });
const parameter = (extra = {}) => ({ Type: 'String', ...extra });
const retain = { DeletionPolicy: 'Retain', UpdateReplacePolicy: 'Retain' };
const visibility = (name) => ({
  CloudWatchMetricsEnabled: true,
  SampledRequestsEnabled: false,
  MetricName: name,
});
export function generateTemplates({ request, response }) {
  const storage = {
    AWSTemplateFormatVersion: '2010-09-09',
    Description: 'D-Apps private storage. Deploy only in ap-northeast-1.',
    Parameters: {
      DistributionArn: parameter({
        Default: '',
        AllowedPattern:
          '^$|^arn:aws:cloudfront::[0-9]{12}:distribution/[A-Z0-9]+$',
      }),
    },
    Conditions: {
      HasDistribution: {
        'Fn::Not': [{ 'Fn::Equals': [ref('DistributionArn'), ''] }],
      },
    },
    Resources: /** @type {Record<string, any>} */ ({}),
    Outputs: {},
  };
  for (const name of ['Site', 'Downloads']) {
    storage.Resources[name + 'Bucket'] = {
      Type: 'AWS::S3::Bucket',
      ...retain,
      Properties: {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            { ServerSideEncryptionByDefault: { SSEAlgorithm: 'AES256' } },
          ],
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
        OwnershipControls: {
          Rules: [{ ObjectOwnership: 'BucketOwnerEnforced' }],
        },
        VersioningConfiguration: { Status: 'Enabled' },
        Tags: [{ Key: 'Project', Value: 'D-Apps' }],
      },
    };
    storage.Resources[name + 'Policy'] = {
      Type: 'AWS::S3::BucketPolicy',
      Properties: {
        Bucket: ref(name + 'Bucket'),
        PolicyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'RequireCreateOnlyWrites',
              Effect: 'Deny',
              Principal: '*',
              Action: 's3:PutObject',
              Resource: sub('${' + name + 'Bucket.Arn}/*'),
              Condition: {
                Null: { 's3:if-none-match': 'true' },
                Bool: { 's3:ObjectCreationOperation': 'true' },
              },
            },
            {
              Sid: 'DenyInsecureTransport',
              Effect: 'Deny',
              Principal: '*',
              Action: 's3:*',
              Resource: [
                att(name + 'Bucket', 'Arn'),
                sub('${' + name + 'Bucket.Arn}/*'),
              ],
              Condition: { Bool: { 'aws:SecureTransport': 'false' } },
            },
            {
              'Fn::If': [
                'HasDistribution',
                {
                  Sid: 'CloudFrontReadOnly',
                  Effect: 'Allow',
                  Principal: { Service: 'cloudfront.amazonaws.com' },
                  Action: 's3:GetObject',
                  Resource: sub('${' + name + 'Bucket.Arn}/*'),
                  Condition: {
                    StringEquals: { 'AWS:SourceArn': ref('DistributionArn') },
                  },
                },
                ref('AWS::NoValue'),
              ],
            },
          ],
        },
      },
    };
    storage.Outputs[name + 'BucketName'] = { Value: ref(name + 'Bucket') };
  }
  const edge = {
    AWSTemplateFormatVersion: '2010-09-09',
    Description:
      'D-Apps edge, TLS, WAF, and explicitly FREE subscription. Deploy in us-east-1.',
    Parameters: {
      HostedZoneId: parameter({ AllowedPattern: '^[A-Z0-9]+$' }),
      SiteBucketName: parameter({
        AllowedPattern: '^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$',
      }),
      DownloadsBucketName: parameter({
        AllowedPattern: '^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$',
      }),
      ReleaseId: parameter({
        Default: 'pending',
        AllowedPattern: '^(pending|[a-f0-9]{40})$',
      }),
      EnableDistribution: {
        Type: 'String',
        Default: 'false',
        AllowedValues: ['true', 'false'],
      },
    },
    Conditions: {
      EnableDelivery: { 'Fn::Equals': [ref('EnableDistribution'), 'true'] },
    },
    Resources: {
      Certificate: {
        Type: 'AWS::CertificateManager::Certificate',
        Properties: {
          DomainName: 'deepledeeple.com',
          SubjectAlternativeNames: ['www.deepledeeple.com'],
          ValidationMethod: 'DNS',
          DomainValidationOptions: [
            'deepledeeple.com',
            'www.deepledeeple.com',
          ].map((DomainName) => ({
            DomainName,
            HostedZoneId: ref('HostedZoneId'),
          })),
        },
      },
      OAC: {
        Type: 'AWS::CloudFront::OriginAccessControl',
        Properties: {
          OriginAccessControlConfig: {
            Name: sub('${AWS::StackName}-oac'),
            OriginAccessControlOriginType: 's3',
            SigningBehavior: 'always',
            SigningProtocol: 'sigv4',
          },
        },
      },
      RequestFunction: {
        Type: 'AWS::CloudFront::Function',
        Properties: {
          Name: sub('${AWS::StackName}-request'),
          AutoPublish: true,
          FunctionConfig: {
            Comment:
              'Allowlisted routing, revocation and query removal; no request logs.',
            Runtime: 'cloudfront-js-2.0',
          },
          FunctionCode: request,
        },
      },
      ResponseFunction: {
        Type: 'AWS::CloudFront::Function',
        Properties: {
          Name: sub('${AWS::StackName}-response'),
          AutoPublish: true,
          FunctionConfig: {
            Comment: 'Privacy and security headers; no request logs.',
            Runtime: 'cloudfront-js-2.0',
          },
          FunctionCode: response,
        },
      },
      WAF: {
        Type: 'AWS::WAFv2::WebACL',
        Properties: {
          Scope: 'CLOUDFRONT',
          DefaultAction: { Allow: {} },
          VisibilityConfig: visibility('DAppsWebACL'),
          Rules: [
            {
              Name: 'KnownBadInputs',
              Priority: 0,
              OverrideAction: { None: {} },
              Statement: {
                ManagedRuleGroupStatement: {
                  VendorName: 'AWS',
                  Name: 'AWSManagedRulesKnownBadInputsRuleSet',
                },
              },
              VisibilityConfig: visibility('DAppsBadInputs'),
            },
            {
              Name: 'RequestRate',
              Priority: 1,
              Action: { Block: {} },
              Statement: {
                RateBasedStatement: {
                  AggregateKeyType: 'IP',
                  Limit: 2000,
                  EvaluationWindowSec: 300,
                },
              },
              VisibilityConfig: visibility('DAppsRate'),
            },
            {
              Name: 'ReadOnly',
              Priority: 2,
              Action: { Block: {} },
              Statement: {
                NotStatement: {
                  Statement: {
                    OrStatement: {
                      Statements: ['GET', 'HEAD'].map((method) => ({
                        ByteMatchStatement: {
                          FieldToMatch: { Method: {} },
                          PositionalConstraint: 'EXACTLY',
                          SearchString: method,
                          TextTransformations: [{ Priority: 0, Type: 'NONE' }],
                        },
                      })),
                    },
                  },
                },
              },
              VisibilityConfig: visibility('DAppsReadOnly'),
            },
          ],
        },
      },
      Distribution: {
        Type: 'AWS::CloudFront::Distribution',
        Properties: {
          DistributionConfig: {
            Enabled: { 'Fn::If': ['EnableDelivery', true, false] },
            Comment:
              'D-Apps: no visitor logs; Free subscription required before enabling.',
            Aliases: ['deepledeeple.com', 'www.deepledeeple.com'],
            IPV6Enabled: true,
            HttpVersion: 'http2and3',
            WebACLId: att('WAF', 'Arn'),
            DefaultRootObject: 'index.html',
            Origins: [
              {
                Id: 'Site',
                DomainName: sub(
                  '${SiteBucketName}.s3.ap-northeast-1.amazonaws.com',
                ),
                OriginPath: sub('/releases/${ReleaseId}'),
                OriginAccessControlId: ref('OAC'),
                S3OriginConfig: { OriginAccessIdentity: '' },
              },
              {
                Id: 'Downloads',
                DomainName: sub(
                  '${DownloadsBucketName}.s3.ap-northeast-1.amazonaws.com',
                ),
                OriginAccessControlId: ref('OAC'),
                S3OriginConfig: { OriginAccessIdentity: '' },
              },
            ],
            ViewerCertificate: {
              AcmCertificateArn: ref('Certificate'),
              SslSupportMethod: 'sni-only',
              MinimumProtocolVersion: 'TLSv1.2_2021',
            },
            DefaultCacheBehavior: behavior('Site'),
            CacheBehaviors: [
              { ...behavior('Downloads'), PathPattern: '/downloads/*' },
            ],
            CustomErrorResponses: [403, 404].map((ErrorCode) => ({
              ErrorCode,
              ResponseCode: 404,
              ResponsePagePath: '/404.html',
              ErrorCachingMinTTL: 0,
            })),
          },
        },
      },
      FreePlan: {
        Type: 'AWS::PricingPlanManager::Subscription',
        ...retain,
        Properties: {
          PlanFamily: 'CloudFront',
          PlanTier: 'FREE',
          ResourceArns: [
            sub(
              'arn:aws:cloudfront::${AWS::AccountId}:distribution/${Distribution}',
            ),
            att('WAF', 'Arn'),
            sub('arn:aws:route53:::hostedzone/${HostedZoneId}'),
          ],
        },
      },
    },
    Outputs: {
      DistributionId: { Value: ref('Distribution') },
      DistributionArn: {
        Value: sub(
          'arn:aws:cloudfront::${AWS::AccountId}:distribution/${Distribution}',
        ),
      },
      DistributionDomain: { Value: att('Distribution', 'DomainName') },
      SubscriptionArn: { Value: ref('FreePlan') },
      RequestFunctionName: { Value: ref('RequestFunction') },
      ResponseFunctionName: { Value: ref('ResponseFunction') },
    },
  };
  function behavior(origin) {
    return {
      TargetOriginId: origin,
      ViewerProtocolPolicy: 'redirect-to-https',
      AllowedMethods: ['GET', 'HEAD'],
      CachedMethods: ['GET', 'HEAD'],
      Compress: origin === 'Site',
      CachePolicyId: '658327ea-f89d-4fab-a63d-7e88639e58f6',
      ResponseHeadersPolicyId: '67f7725c-6f97-4210-82d7-5512b31e9d03',
      FunctionAssociations: [
        {
          EventType: 'viewer-request',
          FunctionARN: att('RequestFunction', 'FunctionARN'),
        },
        {
          EventType: 'viewer-response',
          FunctionARN: att('ResponseFunction', 'FunctionARN'),
        },
      ],
    };
  }
  const dns = {
    AWSTemplateFormatVersion: '2010-09-09',
    Description:
      'Final DNS cutover only after approved release and ACTIVE FREE subscription.',
    Parameters: {
      HostedZoneId: parameter(),
      DistributionDomain: parameter({
        AllowedPattern: '^d[a-z0-9]+\\.cloudfront\\.net$',
      }),
    },
    Resources: {
      Records: {
        Type: 'AWS::Route53::RecordSetGroup',
        Properties: {
          HostedZoneId: ref('HostedZoneId'),
          RecordSets: ['deepledeeple.com', 'www.deepledeeple.com'].flatMap(
            (Name) =>
              ['A', 'AAAA'].map((Type) => ({
                Name,
                Type,
                AliasTarget: {
                  DNSName: ref('DistributionDomain'),
                  HostedZoneId: 'Z2FDTNDATAQYW2',
                  EvaluateTargetHealth: false,
                },
              })),
          ),
        },
      },
    },
  };
  const publisher = {
    AWSTemplateFormatVersion: '2010-09-09',
    Description:
      'GitHub OIDC for D-Apps content publishing only. No long-lived access key.',
    Parameters: {
      OidcProviderArn: parameter(),
      SiteBucketName: parameter(),
      DownloadsBucketName: parameter(),
      DistributionId: parameter(),
    },
    Resources: {
      PublisherRole: {
        Type: 'AWS::IAM::Role',
        Properties: {
          MaxSessionDuration: 3600,
          AssumeRolePolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: { Federated: ref('OidcProviderArn') },
                Action: 'sts:AssumeRoleWithWebIdentity',
                Condition: {
                  StringEquals: {
                    'token.actions.githubusercontent.com:aud':
                      'sts.amazonaws.com',
                    'token.actions.githubusercontent.com:sub':
                      'repo:TaigaShinohara/D-Apps-Platform:environment:production',
                  },
                },
              },
            ],
          },
          Policies: [
            {
              PolicyName: 'PublishVerifiedContent',
              PolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                  {
                    Effect: 'Allow',
                    Action: ['s3:GetObject', 's3:PutObject'],
                    Resource: [
                      sub('arn:aws:s3:::${SiteBucketName}/releases/*'),
                      sub('arn:aws:s3:::${DownloadsBucketName}/downloads/*'),
                    ],
                  },
                  {
                    Effect: 'Allow',
                    Action: [
                      'cloudfront:GetDistribution',
                      'cloudfront:GetDistributionConfig',
                      'cloudfront:CreateInvalidation',
                      'cloudfront:GetInvalidation',
                    ],
                    Resource: sub(
                      'arn:aws:cloudfront::${AWS::AccountId}:distribution/${DistributionId}',
                    ),
                  },
                ],
              },
            },
          ],
        },
      },
    },
    Outputs: { PublisherRoleArn: { Value: att('PublisherRole', 'Arn') } },
  };
  return { storage, edge, dns, publisher };
}
