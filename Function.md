# 피그마 이미지 리사이저 플러그인 기능 명세

## 1. 전역 구성
- **환경**: Figma Plugin API (manifest v3), UI iframe (React/Vanilla 가능)
- **데이터 흐름**: 플러그인 코드 → 선택 노드 메타 수집 → UI에 postMessage로 전달 → UI에서 옵션 적용 후 encode 요청 → 플러그인에서 래스터라이즈 & 결과 회신
- **상태 관리**: UI 내 global store (예: Zustand)로 선택 노드 정보, export 옵션, 미리보기 상태 보관

## 2. 노드 선택 감지
| 항목 | 설명 |
| --- | --- |
| Trigger | `figma.on('selectionchange')` |
| Input | 현재 선택된 nodes 배열 |
| 행동 | 이미지/프레임 여부 검사, 최초 1개 노드만 허용 |
| Output | `{nodeId, name, width, height, hasImageFill, fills[]}` |
| 예외 | 선택 노드 없음 → UI에 `NO_SELECTION` 이벤트 |

## 3. Export 옵션 패널
| 항목 | 내용 |
| --- | --- |
| 포맷 선택 | PNG, JPG, WebP 드롭다운 |
| 스케일 | 0.25x~4x, step 0.25 |
| 배경 옵션 | 투명 / HEX 컬러 입력 |
| DPI 입력 (선택) | 숫자 입력, 단위 고정 72/144 |
| Preset 저장 | 현재 옵션을 로컬스토리지에 저장, 파일 ID 기반 key |

UI 변경 시 `updateExportOptions` 액션 발생 → 상태 갱신 후 예상 용량 계산 트리거.

## 4. 예상 용량 계산
### 4.1 빠른 추정 모드
- **메서드**: `estimateSize(width, height, format, scale, quality)`  
  - 출력: `{bytesEstimate, compressionRatio}`  
  - JPG/WebP 품질은 0~1, PNG는 고정 ratio 0.6 가정
- **빈도**: 옵션 변경 시마다 debounce 150ms

### 4.2 정밀 계산 모드
- UI의 “정밀 계산” 버튼 클릭 → 플러그인에서 `figma.exportAsync(node, {format, constraint, backgroundColor, jpgQuality})`
- 결과 ArrayBuffer 길이를 실제 용량으로 표시
- 4K 이상 노드일 경우 진행 중 스피너 및 취소 버튼 제공

## 5. 품질 조절 & 실시간 미리보기
| 기능 | 세부 내용 |
| --- | --- |
| 품질 슬라이더 | 0~1 (step 0.05), PNG는 0~9 |
| Canvas 렌더링 | UI에서 `ImageBitmap` 생성 후 `<canvas>` draw |
| 썸네일 모드 | 기본 1024px로 축소 후 encode, “원본 보기” 토글 시 풀사이즈 요청 |
| 용량 표시 | encode된 dataURL의 byte 길이 계산 |
| 히스토리 | 최근 5개 `{quality, size, timestamp}` 배열로 저장, 그래프 표시 |
| 프리셋 | `high(0.95)`, `balanced(0.8)`, `lite(0.6)`, `ultra(0.4)` |

encode는 Web Worker에서 수행하여 UI 프리즈 방지.

## 6. Export 실행
| 항목 | 설명 |
| --- | --- |
| Trigger | “Export” 버튼 |
| 액션 | 현재 옵션으로 `exportAsync` 호출 후 `figma.ui.postMessage({type:'DOWNLOAD', blob})` |
| 파일명 규칙 | `{nodeName}_{scale}x_{quality}.{ext}` |
| 진행 상태 | Progress bar 및 완료 토스트, 오류 시 재시도 버튼 |

## 7. 설정 저장/로드
- **저장**: `localStorage.setItem('preset_{fileKey}', JSON.stringify(options))`
- **자동 로드**: 플러그인 초기화 시 현재 파일 key로 preset 로드, 없으면 기본값
- **공유**: 추후 팀 단위 preset을 위해 `figma.clientStorage` 확장 여지 명시

## 8. 예외 및 경고
| 상황 | 처리 |
| --- | --- |
| 선택 노드 없음 | 중앙 overlay “노드를 선택하세요” |
| 지원 불가 포맷 | SVG 등 벡터만 있을 경우 “래스터 가능한 노드를 선택” 안내 |
| 대용량(>4096px) | 경고 모달, 계속 진행/취소 선택 |
| encode 실패 | 오류 메시지 + 개발자 콘솔 로그 링크 |

## 9. Telemetry (옵션)
- 이벤트: 옵션 변경, 정밀 계산 실행, 품질 슬라이더 이동, export 완료
- 데이터: 익명화된 파일 크기, 절감율
- 용도: 향후 프리셋 추천 및 성능 개선

