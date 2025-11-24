# Image Optimizer Figma Plugin

## 설치 및 실행
1. Figma → Plugins → Development → **Import plugin from manifest**.
2. 이 저장소의 `manifest.json` 선택.
3. 플러그인이 등록되면 Design 화면에서 노드를 선택한 뒤 `Plugins → Development → Image Optimizer` 실행.

## history 자동 기록 설정
1. 의존성 설치: `npm install` (추가 패키지는 없고 Node 기본만 사용).
2. git 훅 경로 지정: `git config core.hooksPath .githooks`.
3. 이후 커밋할 때마다 `npm run update-history`가 자동 실행되어 변경 파일 목록이 `history.md`에 append됩니다. 수동 실행도 가능: `npm run update-history`.

## 주요 기능
- 선택 노드의 폭·높이와 이미지 여부 자동 감지.
- PNG/JPG/WebP 포맷, 스케일, 배경, DPI, 품질 슬라이더 제공.
- 추정 용량과 실제 encode 기반 용량(정밀 계산) 제공.
- 실시간 미리보기 및 최근 품질/용량 히스토리.
- Export 결과를 UI에서 바로 다운로드.

## 개발 메모
- `code.js`는 Figma Plugin API를 사용해 노드 export/encode를 수행합니다.
- `ui.html`은 HTML/CSS/Vanilla JS 기반 단일 파일 UI입니다.
- 필요 시 React/Vite 등으로 확장하도록 구조를 단순화했습니다.
- 텔레메트리, 배치 export, preset 공유 등은 차후 확장 여지를 남겨두었습니다.

## 테스트 팁
- 큰 노드(4096px 이상)는 encode 시간이 길어질 수 있으므로 소형 썸네일 모드로 먼저 확인하세요.
- JPG/WebP 품질은 0.1~1 범위이며, PNG는 슬라이더 값을 압축 정도로 간주합니다.
- Export 파일명은 `{노드명}_{스케일}x_{품질%}.{ext}` 패턴을 따릅니다.
