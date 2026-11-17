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

resource "google_service_account" "publisher" {
  provider     = google-beta
  project      = var.project_id
  account_id   = "d-apps-hosting-publisher"
  display_name = "D-Apps reviewed Hosting releases"
  depends_on   = [google_project_service.required]
}

# Hosting does not support fine-grained custom roles. This predefined role
# can publish/delete Hosting resources: staging separation is procedural,
# not an IAM security boundary. Limit it to this dedicated project.
resource "google_project_iam_member" "hosting" {
  provider = google-beta
  project  = var.project_id
  role     = "roles/firebasehosting.admin"
  member   = "serviceAccount:${google_service_account.publisher.email}"
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
    "google.subject"          = "assertion.sub"
    "attribute.repository_id" = "assertion.repository_id"
  }
  attribute_condition = join(" && ", [
    "assertion.repository_owner_id == '178877625'",
    "assertion.repository_id == '1459714940'",
    "assertion.ref == 'refs/heads/main'",
    "assertion.sub == 'repo:TaigaShinohara/D-Apps-Platform:environment:production'",
    "assertion.workflow_ref in ['TaigaShinohara/D-Apps-Platform/.github/workflows/stage-content.yml@refs/heads/main', 'TaigaShinohara/D-Apps-Platform/.github/workflows/release-hosting.yml@refs/heads/main']",
  ])
  oidc { issuer_uri = "https://token.actions.githubusercontent.com" }
}

resource "google_service_account_iam_member" "github" {
  provider           = google-beta
  service_account_id = google_service_account.publisher.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository_id/1459714940"
}

output "github_environment_variables" {
  value = {
    GCP_PROJECT_ID                 = var.project_id
    FIREBASE_SITE_ID               = google_firebase_hosting_site.site.site_id
    GCP_WORKLOAD_IDENTITY_PROVIDER = google_iam_workload_identity_pool_provider.github.name
    GCP_PUBLISHER_SERVICE_ACCOUNT  = google_service_account.publisher.email
  }
}
