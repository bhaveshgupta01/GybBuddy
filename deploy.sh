#!/bin/bash
set -e

# ============================================
# GymBro — Deploy to Google Cloud Run
# ============================================
# Prerequisites:
#   1. gcloud CLI installed and authenticated (gcloud auth login)
#   2. A GCP project with billing enabled
#   3. .env file with all API keys populated
#
# Usage:
#   ./deploy.sh                          # uses defaults
#   ./deploy.sh --project my-gcp-project # override project
# ============================================

PROJECT_ID="${GCP_PROJECT_ID:-}"
REGION="us-central1"
SERVICE_NAME="gymbro"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# Parse args
while [[ $# -gt 0 ]]; do
  case $1 in
    --project) PROJECT_ID="$2"; shift 2 ;;
    --region) REGION="$2"; shift 2 ;;
    *) echo "Unknown flag: $1"; exit 1 ;;
  esac
done

# Resolve project
if [ -z "$PROJECT_ID" ]; then
  PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
fi

if [ -z "$PROJECT_ID" ]; then
  echo "Error: No GCP project set. Use --project <id> or run: gcloud config set project <id>"
  exit 1
fi

IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "==> Deploying GymBro to Cloud Run"
echo "    Project:  $PROJECT_ID"
echo "    Region:   $REGION"
echo "    Service:  $SERVICE_NAME"
echo ""

# Load .env file for build args
if [ ! -f .env ]; then
  echo "Error: .env file not found. Copy .env.example and fill in your keys."
  exit 1
fi

source .env

# Enable required APIs
echo "==> Enabling Cloud Run & Container Registry APIs..."
gcloud services enable run.googleapis.com containerregistry.googleapis.com --project "$PROJECT_ID" --quiet

# Build the Docker image with API keys baked into the static build
echo "==> Building Docker image..."
gcloud builds submit \
  --tag "$IMAGE_NAME" \
  --project "$PROJECT_ID" \
  --build-arg "EXPO_PUBLIC_GEMINI_API_KEY=${EXPO_PUBLIC_GEMINI_API_KEY}" \
  --build-arg "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=${EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}" \
  --build-arg "EXPO_PUBLIC_FIREBASE_API_KEY=${EXPO_PUBLIC_FIREBASE_API_KEY}" \
  --build-arg "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=${EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN}" \
  --build-arg "EXPO_PUBLIC_FIREBASE_PROJECT_ID=${EXPO_PUBLIC_FIREBASE_PROJECT_ID}" \
  --build-arg "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=${EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET}" \
  --build-arg "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}" \
  --build-arg "EXPO_PUBLIC_FIREBASE_APP_ID=${EXPO_PUBLIC_FIREBASE_APP_ID}" \
  --quiet

# Deploy to Cloud Run
echo "==> Deploying to Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
  --image "$IMAGE_NAME" \
  --platform managed \
  --region "$REGION" \
  --project "$PROJECT_ID" \
  --allow-unauthenticated \
  --port 8080 \
  --memory 256Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 3 \
  --quiet

# Get the URL
URL=$(gcloud run services describe "$SERVICE_NAME" --region "$REGION" --project "$PROJECT_ID" --format 'value(status.url)')

echo ""
echo "============================================"
echo "  GymBro deployed successfully!"
echo "  URL: $URL"
echo "============================================"
