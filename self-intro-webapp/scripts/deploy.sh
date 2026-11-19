#!/usr/bin/env bash
# web/ 폴더를 S3에 올리고 CloudFront 캐시를 비웁니다.
# 사용법: BUCKET=내-버킷-이름 DISTRIBUTION_ID=E123ABC... ./scripts/deploy.sh
set -euo pipefail

: "${BUCKET:?BUCKET 환경변수를 지정하세요}"
: "${DISTRIBUTION_ID:?DISTRIBUTION_ID 환경변수를 지정하세요}"

cd "$(dirname "$0")/.."
aws s3 sync web/ "s3://${BUCKET}/" --delete
aws cloudfront create-invalidation --distribution-id "${DISTRIBUTION_ID}" --paths "/*"
