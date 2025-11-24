# 변경 이력

## 2025-11-24 16:24:51 KST
- `PRD.md` 작성: 문제 정의, 목표, 주요 기능, 기술 고려 사항 정리.
- `Userflow.md` 작성: 노드 선택부터 Export까지 단계별 사용자 흐름 기록.
- `Function.md` 작성: 선택 감지, 옵션 패널, 용량 계산, 품질 미리보기, Export 등 기능별 명세.
- 플러그인 기본 구조 구현: `manifest.json`, `code.js`, `ui.html` 추가 및 selection/preview/export 로직 구성.
- `README.md` 작성: 설치 방법, 기능 요약, 테스트 팁 문서화.

## 2025-11-24 16:28:26 KST
- history 자동 기록을 위한 `package.json`과 `scripts/update-history.js` 추가.
- `.githooks/pre-commit` 훅으로 커밋 시 `npm run update-history` 자동 실행 구조 도입.
- `README.md`에 history 자동화 설정 방법 추가.

