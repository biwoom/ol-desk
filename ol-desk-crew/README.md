# ol-desk-crew

OL-DESK-CREW는 불교전문문헌 번역을 위한 인간 중심 AI 협업 작업 폴더이다.

```text
ol-desk-crew/
├─ ol-desk/
│  └─ Astro 기반 Human UX 앱 자리
├─ contents-asset/
│  └─ 원고, JSON 데이터, 로그, handoff, 내보내기 산출물
└─ ai-agent/
   └─ Crew/도반 에이전트 운영 지침과 템플릿
```

핵심 원칙:

```text
- 인간 감수자가 최종 판단한다.
- AI 에이전트는 Crew이자 도반으로 작업한다.
- 원고와 Markdown 내보내기 산출물은 Markdown으로 저장한다.
- 수정정보, 후보, 상태, 감수자 메모, 로그, handoff는 JSON으로 저장한다.
- Paperclip API에 직접 의존하지 않고 Contents-Asset 표준 파일을 읽고 쓴다.
```

기획 기준 문서:

```text
ol-desk-crew/manual/00_OL-CREW_전체기획.md
ol-desk-crew/manual/01_OL-DESK_개발기획.md
ol-desk-crew/manual/02_Contents-Asset_데이터구조기획.md
ol-desk-crew/manual/03_AI-Agent_운영기획.md
ol-desk-crew/manual/04_번역워크플로우_운영매뉴얼.md
```
