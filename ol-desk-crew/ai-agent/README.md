# ai-agent

OL-DESK-CREW의 에이전트 운영 지침 위치이다.

운영 구조:

```text
인간 편집자
└─ 00-총괄 번역 디렉터-법장
   ├─ A00-2차 생산 관리 매니저-선행
   │  ├─ A01-기초 정리 에이전트-정안
   │  ├─ A02-참고번역 분리 에이전트-분명
   │  ├─ A03-용어 후보 에이전트-명해
   │  ├─ A04-1차 번역 에이전트-초역
   │  ├─ A05-원문대조 감수 에이전트-조견
   │  ├─ A06-각주 후보 에이전트-해의
   │  └─ A07-2차 번역 에이전트-윤문
   └─ B00-3차 확정 관리 매니저-결정
      ├─ B01-인간검수 준비 에이전트-청문
      ├─ B02-3차 반영 에이전트-정반
      ├─ B03-최종스캔 에이전트-무루
      └─ B04-최종탈고 인계 에이전트-회향
```

원칙:

```text
- AI 에이전트는 Crew이자 도반으로 작업한다.
- 인간 확정권을 침범하지 않는다.
- 작업 완료 시 Contents-Asset에 산출물과 agent-log JSON을 남긴다.
- Paperclip 내부 기록은 보조 기록이며, 표준 데이터 소스는 Contents-Asset이다.
```

주요 문서:

```text
COMMON.md
company/00-director-beopjang/AGENTS.md
company/A00-manager-seonhaeng/AGENTS.md
company/B00-manager-gyeoljeong/AGENTS.md
agents/A-line/*/AGENTS.md
agents/B-line/*/AGENTS.md
init-tasks/00-director-init-task.md
```
