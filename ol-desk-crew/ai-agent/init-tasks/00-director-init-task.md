# Init Task: 00-총괄 번역 디렉터-법장

이 문서는 `00-총괄 번역 디렉터-법장`에게 처음 할당할 초기 task 지시서이다. 디렉터는 이 문서를 읽고 OL-DESK-CREW 에이전트 운영을 시작한다.

## Objective

OL-DESK-CREW의 번역 에이전트 조직을 초기화하고, Contents-Asset 기반 진행 현황을 파악한 뒤 A라인과 B라인에 필요한 첫 작업을 위임한다.

디렉터는 직접 번역하지 않는다. 디렉터는 우선순위, 위임, 보류·오류 확인, 인간 판단 요청 정리를 담당한다.

## Required References

### Project Manuals

- `/Users/damjin/Projects/ol-project/OL-Project-매뉴얼/OL-CREW/00_OL-CREW_전체기획.md`
- `/Users/damjin/Projects/ol-project/OL-Project-매뉴얼/OL-CREW/01_OL-DESK_개발기획.md`
- `/Users/damjin/Projects/ol-project/OL-Project-매뉴얼/OL-CREW/02_Contents-Asset_데이터구조기획.md`
- `/Users/damjin/Projects/ol-project/OL-Project-매뉴얼/OL-CREW/03_AI-Agent_운영기획.md`
- `/Users/damjin/Projects/ol-project/OL-Project-매뉴얼/OL-CREW/04_번역워크플로우_운영매뉴얼.md`

### Paperclip Instruction Samples

- `/Users/damjin/Projects/ol-project/OL-Project-매뉴얼/OL-AGENT/CEO 지침샘플/AGENTS.md.md`
- `/Users/damjin/Projects/ol-project/OL-Project-매뉴얼/OL-AGENT/CEO 지침샘플/HEARTBEAT.md.md`
- `/Users/damjin/Projects/ol-project/OL-Project-매뉴얼/OL-AGENT/CEO 지침샘플/SOUL.md.md`
- `/Users/damjin/Projects/ol-project/OL-Project-매뉴얼/OL-AGENT/CEO 지침샘플/TOOLS.md.md`

## Agent Instruction Paths

### Common

- `ol-desk-crew/ai-agent/COMMON.md`

### Director and Managers

- `ol-desk-crew/ai-agent/company/00-director-beopjang/AGENTS.md`
- `ol-desk-crew/ai-agent/company/A00-manager-seonhaeng/AGENTS.md`
- `ol-desk-crew/ai-agent/company/B00-manager-gyeoljeong/AGENTS.md`

### A-Line Agents

- `ol-desk-crew/ai-agent/agents/A-line/A01-jeongan/AGENTS.md`
- `ol-desk-crew/ai-agent/agents/A-line/A02-bunmyeong/AGENTS.md`
- `ol-desk-crew/ai-agent/agents/A-line/A03-myeonghae/AGENTS.md`
- `ol-desk-crew/ai-agent/agents/A-line/A04-choyeok/AGENTS.md`
- `ol-desk-crew/ai-agent/agents/A-line/A05-jogyeon/AGENTS.md`
- `ol-desk-crew/ai-agent/agents/A-line/A06-haeui/AGENTS.md`
- `ol-desk-crew/ai-agent/agents/A-line/A07-yunmun/AGENTS.md`

### B-Line Agents

- `ol-desk-crew/ai-agent/agents/B-line/B01-cheongmun/AGENTS.md`
- `ol-desk-crew/ai-agent/agents/B-line/B02-jeongban/AGENTS.md`
- `ol-desk-crew/ai-agent/agents/B-line/B03-muru/AGENTS.md`
- `ol-desk-crew/ai-agent/agents/B-line/B04-hoehyang/AGENTS.md`

## Initial Checklist

1. Read `COMMON.md` and the director `AGENTS.md`.
2. Confirm the active project IDs under `ol-desk-crew/contents-asset/projects/`.
3. For each project, inspect:
   - `data/documents.json`
   - `data/status/`
   - `logs/agent-logs/`
   - `handoff/draft3/`
   - `outputs/manuscripts/`
4. Classify documents by current status:
   - A라인 대상: `source_ready` through `annotation_candidates_done`
   - 인간 감수 준비 대상: `draft2_done`
   - 인간 작업 대기: `human_review_ready`, `human_editing`
   - B라인 대상: `draft3_handoff_ready`, `draft3_requested`
   - 최종검토 대상: `draft3_generated`, `final_scan_done`, `final_review`
   - 주의 대상: `blocked`, `error`
5. Create child tasks for A00 and B00 only when the owner and acceptance criteria are clear.
6. If human judgment is needed, comment with a concise question instead of forcing a state transition.
7. Leave a director review log.

## First Delegation Guidance

### Delegate to A00

Use this when source documents need production work through draft2.

Include:

- project_id
- doc_id list
- current status
- required next status
- required inputs
- expected outputs
- acceptance criteria from `04_번역워크플로우_운영매뉴얼.md`

### Delegate to B00

Use this when human handoff exists or final scan/final handoff is needed.

Include:

- project_id
- doc_id list
- handoff path
- current status
- required next status
- expected outputs
- instruction that B-line may only reflect human-confirmed handoff items

## Acceptance Criteria

The init task is complete when:

1. Active projects and document statuses are summarized.
2. A-line and B-line work queues are identified.
3. Blocked/error documents are listed with reasons or missing files.
4. Clear child tasks are delegated to A00 and/or B00.
5. A director review log is written at:

```text
contents-asset/projects/{project_id}/logs/agent-logs/director/{date}_00_director_review.json
```

6. The Paperclip task receives a final comment with status, delegated tasks, blockers, and next action.
