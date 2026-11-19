# 자기소개 웹앱

클라우드 데이터베이스 과목 자기소개 웹앱 (S3, CloudFront, AppSync, DynamoDB).
기획서의 S01~S05(Home, 소개, 프로젝트, 연락처, 방명록) 구성을 따르는 원페이지 사이트입니다.

## 구성
- `web/`: S3에 올리는 정적 웹사이트 파일
  - `index.html`, `css/style.css`: 화면
  - `js/app.js`: 화면 동작 (프로젝트 상세 창, 방명록 작성·조회)
  - `js/api.js`: 데이터 접근 계층. 지금은 샘플 데이터·메모리 저장, 이후 AppSync 호출로 교체
  - `media/`: 시연 영상
- `archive/week1-apps-script/`: 1주차 Google Apps Script 원본 (보관용)
- `scripts/deploy.sh`: S3 업로드와 CloudFront 캐시 무효화

## 배포
```
BUCKET=버킷이름 DISTRIBUTION_ID=배포ID ./scripts/deploy.sh
```

## 할 일
- [ ] `web/js/api.js`를 AppSync(GraphQL) 호출로 교체
