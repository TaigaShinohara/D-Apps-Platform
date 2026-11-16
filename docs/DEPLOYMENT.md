# AWS deployment and recovery

**Status: prepared, not deployed.** Do not run resource-creating commands until the owner approves the reviewed release, account, costs and DNS changes. Merging this repository is independent of publishing the website.

## Generated stacks and reviewable changes

`npm run build` generates the following from `scripts/templates.mjs` and the actual static output. Templates are CI artifacts, not checked-in stale copies.

| Template         | Region                 | Changes                                                                                                                                                                                                                                              |
| ---------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `storage.json`   | ap-northeast-1         | Two private S3 buckets, encryption, ownership controls, versioning and bucket policies. Public access is blocked. Only the bound distribution can read via OAC. Conditional create-only writes are enforced. Buckets are retained on stack deletion. |
| `edge.json`      | us-east-1              | ACM certificate for apex/www with DNS-validation records in the existing zone; CloudFront, OAC, two Functions, WAF and a `FREE` PricingPlanManager subscription. Distribution starts disabled.                                                       |
| `publisher.json` | ap-northeast-1         | GitHub OIDC content-publisher role scoped to this repository's `production` environment. No long-lived key, delete, DNS, IAM or distribution-update privileges. Uses an existing OIDC provider.                                                      |
| `dns.json`       | Existing Route 53 zone | Four records only: apex/www A and AAAA aliases to the reviewed distribution. No NS, MX or TXT replacement. Apply only after pre-cutover tests.                                                                                                       |

Free-plan eligibility and account contract are not established by successful template linting. `AWS::PricingPlanManager::Subscription` must become ACTIVE with PlanTier FREE and cover the intended distribution/WAF/zone. A failed Free subscription must stop the rollout; never remove it to fall back to paid delivery. Creating WAF before it is associated with the plan can have a short separately billed interval. Check that before execution.

## Prerequisites

Use the project's authenticated, least-privileged AWS connection. The workstation's default STS call returned `InvalidClientTokenId` during preparation; no valid project-specific AWS connection or hosted-zone ID was established. Do not substitute another project's administrator profile. Authentication is a separate prerequisite from authorization to publish.

Record verified account ID, existing hosted-zone ID, existing records, existing GitHub OIDC provider ARN, Free-plan eligibility and payment-plan type in the private operations record. Never commit credentials or account-specific authentication files. With valid credentials, inspect only relevant resources:

```sh
aws sts get-caller-identity
aws route53 list-hosted-zones-by-name --dns-name deepledeeple.com
aws route53 list-resource-record-sets --hosted-zone-id "$D_APPS_ZONE_ID"
```

Review CloudFront logging v2 delivery sources/destinations as well as legacy distribution logging; S3 server access logging, CloudTrail S3 **data** events (including organization trails/event data stores), WAF logging and sampled requests, and any organization-enforced telemetry. Do not disable unrelated account-wide auditing. If visitor requests would still be retained, stop and resolve that conflict before publishing. Management audit records and aggregate metrics may remain enabled.

## Reviewed release sequence

1. On a clean reviewed commit, run the README checks and `npm run verify:release -- --fetch --macos`. Complete OneClip basic launch/capture/export checks using synthetic data on a suitable test account; do not change its updater endpoint. Keep the verified ZIP unchanged.
2. Inspect all generated templates with `cfn-lint`. Obtain change sets for each stack after explicit execution approval. `storage.json` must be in Tokyo; `edge.json` in us-east-1. CloudFormation change-set creation itself may require AWS permissions and is not done by local generation.
3. Create the private storage stack with empty `DistributionArn`, then the edge stack with `EnableDistribution=false`, `ReleaseId=pending` and the verified zone/bucket parameters. ACM validation adds CNAME records; it does not cut over the apex/www site.
4. Confirm the Free subscription is ACTIVE and its covered resources match. If unsupported/ineligible, leave delivery disabled and obtain a revised decision. Set `DistributionArn` in the storage stack to bind OAC to exactly this distribution.
5. Create the publisher role using the verified existing OIDC provider. If no provider exists, review an account-level provider addition separately. Configure environment variables `AWS_PUBLISH_ROLE_ARN`, `SITE_BUCKET`, and `DOWNLOADS_BUCKET` in GitHub's `production` environment. They are identifiers, not secrets. The environment must allow only branch `main` and require owner review.
6. Manually run `Stage verified content (manual)` from `main`, review the pending environment deployment and approve only the intended commit. macOS re-verifies signing before obtaining AWS OIDC credentials. The script writes `/releases/<full-commit-sha>/` and `/downloads/oneclip/1.0.1/OneClip-1.0.1.zip`, using `If-None-Match: *` and checksums. It refuses differing existing content. No public pointers change.
7. Download the **matching** generated edge template from that workflow, review a change set with `ReleaseId=<full-commit-sha>` and `EnableDistribution=true`, and apply it. Function allowlists, script hashes and site origin path must come from the same build. Invalidate changed HTML and unversioned assets (`/*` is appropriate for this small site), then wait for distribution deployment and invalidation completion.
8. Before changing DNS, test the apex host against the new distribution using `curl --connect-to` or an equivalent controlled host mapping so Host/SNI remain `deepledeeple.com`. Requests using the raw CloudFront hostname are intentionally rejected. Check direct S3 URLs return 403; verify 200 HTML/downloads, exact ZIP SHA-256, redirects, 404, prohibited methods, and 410 using a deliberately nonexistent test revocation. Confirm missing-origin 403/404/500 handling separately from function-generated 404s.
9. Inspect existing apex/www records again. If records conflict, preserve them as a rollback record and review the precise replacement instead of deleting them blindly. Apply `dns.json` only after the review. Verify actual HTTPS, IPv4/IPv6, apex/www, certificate, policies, no cookies, no external subresources, aggregate metrics and all log settings again.
10. Record the commit, template artifact, stack outputs, previous release, DNS rollback data, measured headers, hashes, Free-plan status and actual bill estimate in the private operations record. Mark production verified only after these checks pass.

Example post-approval stack execution pattern (identifiers are deliberately not filled in):

```sh
aws cloudformation deploy --region ap-northeast-1 \
  --stack-name d-apps-storage --template-file infra/generated/storage.json \
  --no-execute-changeset
```

Review the change set before execution. Do not run this example as an authorization shortcut.

## Security headers and errors

HTTPS redirect, TLS 1.2 minimum, managed SecurityHeadersPolicy and viewer-response headers protect normal content. CSP forbids third-party resources, connections, forms, frames, objects, workers and unapproved scripts. Referrer policy is `no-referrer`, Permissions-Policy disables unused APIs, and COOP/CORP reduce cross-origin exposure. HSTS starts at 300 seconds, without includeSubDomains or preload; increase only after real-domain validation.

Viewer-response Functions do **not** run for every origin-error response. The managed policy remains a baseline and each HTML file carries a meta CSP/no-referrer, but that is not equivalent to every custom HTTP header on all errors. The managed policy can have a longer HSTS lifetime on an error response. Verify actual 403/404/500 and WAF responses before launch; do not claim uniform CSP or framing headers where unmeasured. Function-generated errors and revocations include the full header set.

GET/HEAD are the only accepted viewer methods. WAF uses KnownBadInputs, an IP-based rate limit (2,000 requests/5 minutes) and method blocking; logging and request sampling are disabled. Rate limiting necessarily processes IP addresses transiently within AWS. There is no CAPTCHA or cookie challenge. Tune the rate only using aggregate results and known legitimate download behavior.

## Update and rollback

For normal updates, verify and stage artifacts first, then deploy the matching site release/function definitions. Versioned binaries and hashed assets have long immutable cache lifetimes; HTML and unversioned assets use short CDN caching and browser revalidation. The bucket policy disallows unconditional object creation, and the staging script refuses replacement. The content role cannot delete objects.

For a site rollback, retrieve the previous **verified** commit's matching template artifact and site prefix, preserve current revocations, review the edge change set, switch `ReleaseId` and functions together, invalidate the affected URLs and verify both languages. The Free subscription must remain active. Retained buckets and versions are for recovery; do not delete them as part of rollback.

For a dangerous app release, add its exact path to the revocation list and remove its published link in the same change. Apply the request function first, invalidate that URL, wait, and verify a 410 from every tested edge. Keep revocations when rolling back site content. A file already stored on someone's device cannot be recalled. If targeted blocking cannot be verified quickly, disable the distribution and confirm it is no longer serving content.

For DNS rollback, restore only the recorded previous apex/www records; preserve unrelated DNS. DNS cache lifetimes and HSTS may delay recovery, so prefer restoring the prior verified content within the same distribution when possible.

## Official references

- [Private S3 origins with OAC](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html)
- [Flat-rate plans and feature limits](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/flat-rate-pricing-plan.html)
- [PricingPlanManager account requirements](https://docs.aws.amazon.com/PricingPlanManager/latest/UserGuide/plans.html)
- [CloudFormation subscription resource](https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-pricingplanmanager-subscription.html)
- [S3 conditional-write enforcement](https://docs.aws.amazon.com/AmazonS3/latest/userguide/conditional-writes-enforce.html)
- [CloudFront Function security headers](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/example_cloudfront_functions_add_security_headers_section.html)
