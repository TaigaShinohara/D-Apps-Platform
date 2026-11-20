terraform {
  required_version = "= 1.17.2"
  required_providers {
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "8.11.0"
    }
  }
}

variable "project_id" {
  description = "Existing, owner-approved D-Apps-only Google Cloud project. No billing link is created here."
  type        = string
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{4,28}[a-z0-9]$", var.project_id))
    error_message = "Use the verified Google Cloud project ID."
  }
}

variable "site_id" {
  description = "Owner-approved globally unique Firebase Hosting site ID. Import the default site if it already exists."
  type        = string
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{4,28}[a-z0-9]$", var.site_id))
    error_message = "Use a valid Hosting site ID."
  }
}

provider "google-beta" {
  project               = var.project_id
  billing_project       = var.project_id
  user_project_override = true
}

locals {
  github_owner_id       = "178877625"
  github_repository_id  = "1459714940"
  github_repository     = "TaigaShinohara/D-Apps-Platform"
  github_subject_prefix = "repo:TaigaShinohara@${local.github_owner_id}/D-Apps-Platform@${local.github_repository_id}:environment:"
  stage_subject         = "${local.github_subject_prefix}staging"
  release_subject       = "${local.github_subject_prefix}production"
  stage_workflow        = "${local.github_repository}/.github/workflows/stage-content.yml@refs/heads/main"
  release_workflow      = "${local.github_repository}/.github/workflows/release-hosting.yml@refs/heads/main"
}

resource "google_project_service" "required" {
  provider = google-beta
  for_each = toset([
    "cloudresourcemanager.googleapis.com",
    "firebase.googleapis.com",
    "firebasehosting.googleapis.com",
    "iam.googleapis.com",
    "iamcredentials.googleapis.com",
    "sts.googleapis.com",
  ])
  project            = var.project_id
  service            = each.value
  disable_on_destroy = false
}

resource "google_firebase_project" "site" {
  provider   = google-beta
  project    = var.project_id
  depends_on = [google_project_service.required]
  lifecycle { prevent_destroy = true }
}

resource "google_firebase_hosting_site" "site" {
  provider        = google-beta
  project         = google_firebase_project.site.project
  site_id         = var.site_id
  deletion_policy = "PREVENT"
  lifecycle { prevent_destroy = true }
}

resource "google_service_account" "stager" {
  provider     = google-beta
  project      = var.project_id
  account_id   = "d-apps-hosting-stager"
  display_name = "D-Apps Hosting version staging"
  depends_on   = [google_project_service.required]
}

resource "google_service_account" "releaser" {
  provider     = google-beta
  project      = var.project_id
  account_id   = "d-apps-hosting-releaser"
  display_name = "D-Apps Hosting live releases"
  depends_on   = [google_project_service.required]
}

# Firebase documents that custom roles cannot control Hosting, and there is
# no preview-only or live-release-only predefined role. Hosting Admin is the
# narrowest role that can upload a version or create a live release, and it
# can also delete Hosting resources. Keep it on this dedicated project only.
# The two accounts are still different identities: the stage workflow cannot
# impersonate the releaser, and the release workflow cannot impersonate the
# stager. Do not add Owner, Editor, billing, DNS, or IAM administration.
resource "google_project_iam_member" "stager" {
  provider = google-beta
  project  = var.project_id
  role     = "roles/firebasehosting.admin"
  member   = "serviceAccount:${google_service_account.stager.email}"
}

resource "google_project_iam_member" "releaser" {
  provider = google-beta
  project  = var.project_id
  role     = "roles/firebasehosting.admin"
  member   = "serviceAccount:${google_service_account.releaser.email}"
}

resource "google_iam_workload_identity_pool" "github" {
  provider                  = google-beta
  project                   = var.project_id
  workload_identity_pool_id = "d-apps-github"
  display_name              = "D-Apps GitHub publishing"
  depends_on                = [google_project_service.required]
}

resource "google_iam_workload_identity_pool_provider" "github" {
  provider                           = google-beta
  project                            = var.project_id
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = "github"
  attribute_mapping = {
    "google.subject" = "assertion.sub"
  }
  attribute_condition = join(" && ", [
    "assertion.repository_owner_id == '${local.github_owner_id}'",
    "assertion.repository_id == '${local.github_repository_id}'",
    "assertion.ref == 'refs/heads/main'",
    "((assertion.sub == '${local.stage_subject}' && assertion.workflow_ref == '${local.stage_workflow}') || (assertion.sub == '${local.release_subject}' && assertion.workflow_ref == '${local.release_workflow}'))",
  ])
  oidc { issuer_uri = "https://token.actions.githubusercontent.com" }
}

resource "google_service_account_iam_member" "stager" {
  provider           = google-beta
  service_account_id = google_service_account.stager.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principal://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/subject/${local.stage_subject}"
}

resource "google_service_account_iam_member" "releaser" {
  provider           = google-beta
  service_account_id = google_service_account.releaser.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principal://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/subject/${local.release_subject}"
}

output "github_environment_variables" {
  value = {
    GCP_PROJECT_ID                 = var.project_id
    FIREBASE_SITE_ID               = google_firebase_hosting_site.site.site_id
    GCP_WORKLOAD_IDENTITY_PROVIDER = google_iam_workload_identity_pool_provider.github.name
    GCP_STAGER_SERVICE_ACCOUNT     = google_service_account.stager.email
    GCP_RELEASER_SERVICE_ACCOUNT   = google_service_account.releaser.email
  }
}
