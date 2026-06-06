# OL-DESK-CREW Agent Common Rules

이 문서는 모든 OL-DESK-CREW 에이전트가 함께 따르는 공통 지침이다. 개별 에이전트의 `AGENTS.md`가 더 구체적인 지시를 제공하면 개별 지시를 우선하되, 인간 확정권과 Contents-Asset 원칙은 예외 없이 지킨다.

## 기준 문서

- `ol-desk-crew/manual/00_OL-CREW_전체기획.md`
- `ol-desk-crew/manual/01_OL-DESK_개발기획.md`
- `ol-desk-crew/manual/02_Contents-Asset_데이터구조기획.md`
- `ol-desk-crew/manual/03_AI-Agent_운영기획.md`
- `ol-desk-crew/manual/04_번역워크플로우_운영매뉴얼.md`

## 핵심 원칙

1. OL-DESK-CREW의 표준 데이터 소스는 `contents-asset/`이다.
2. Paperclip 내부 기록은 보조 기록이다. 작업 완료 증거는 Contents-Asset의 산출물과 `agent-log` JSON이다.
3. 원고와 사람이 읽는 산출물은 Markdown으로 저장한다.
4. 상태, 후보, 수정정보, 감수자 메모, handoff, agent-log는 JSON으로 저장한다.
5. 원문 `assets/source/raw/`는 임의로 수정하지 않는다.
6. 인간이 확정하지 않은 용어, 각주, 태그, 해석을 확정된 것처럼 쓰지 않는다.
7. 감수자 메모는 본문에 자동 반영하지 않는다.
8. B라인은 handoff에 포함된 인간 확정 판단만 반영한다.
9. 상태 전환은 필수 파일과 agent-log로 증명되어야 한다.
10. 완료본 수정은 과거 상태 회귀가 아니라 새 revision cycle로 처리한다.

## 표준 경로

```text
contents-asset/projects/{project_id}/assets/source/raw/{doc_id}.md
contents-asset/projects/{project_id}/assets/source/normalized/{doc_id}.md
contents-asset/projects/{project_id}/assets/references/{doc_id}.md
contents-asset/projects/{project_id}/outputs/manuscripts/draft1/{doc_id}.md
contents-asset/projects/{project_id}/outputs/manuscripts/draft2/{doc_id}.md
contents-asset/projects/{project_id}/outputs/manuscripts/draft3/{doc_id}.md
contents-asset/projects/{project_id}/outputs/manuscripts/draft4/{doc_id}.md
contents-asset/projects/{project_id}/data/documents.json
contents-asset/projects/{project_id}/data/segments/{doc_id}.json
contents-asset/projects/{project_id}/data/status/{doc_id}.json
contents-asset/projects/{project_id}/data/terms/terms.json
contents-asset/projects/{project_id}/data/annotations/annotations.json
contents-asset/projects/{project_id}/data/tags/tags.json
contents-asset/projects/{project_id}/data/revisions/{doc_id}.json
contents-asset/projects/{project_id}/data/notes/{doc_id}.json
contents-asset/projects/{project_id}/handoff/draft3/{doc_id}.json
contents-asset/projects/{project_id}/handoff/revision/{doc_id}-{revision_id}.json
contents-asset/projects/{project_id}/logs/agent-logs/{doc_id}/{date}_{agent_id}_{stage}.json
```

## Paperclip 실행 체크

1. 할당된 task와 wake context를 확인한다.
2. 자신의 역할 문서와 이 공통 문서를 읽는다.
3. 필요한 입력 파일 존재 여부를 확인한다.
4. 작업 범위를 벗어나면 담당 매니저 또는 디렉터에게 댓글로 보고한다.
5. 산출물을 표준 경로에 저장한다.
6. `templates/agent-log.template.json` 구조를 따라 agent-log를 남긴다.
7. task에 완료 댓글을 남긴다. 댓글에는 입력, 출력, 남은 이슈, 다음 권장 작업을 포함한다.

## Standard Execution Protocol

모든 에이전트는 작업마다 다음 순서로 실행한다.

### 1. Wake Intake

```text
1. Paperclip task 제목과 본문을 읽는다.
2. parent task가 있으면 parent의 목표와 acceptance criteria를 확인한다.
3. 자신에게 할당된 역할이 task 범위와 맞는지 확인한다.
4. project_id, doc_id, target_stage, 요청 산출물을 식별한다.
5. 범위가 맞지 않으면 작업하지 말고 매니저에게 댓글로 보고한다.
```

### 2. Required Reading

```text
1. 이 COMMON.md를 읽는다.
2. 자신의 AGENTS.md를 읽는다.
3. task가 상태 전환을 포함하면 04_번역워크플로우_운영매뉴얼.md의 해당 상태 완료 조건을 확인한다.
4. task가 파일 생성/수정을 포함하면 02_Contents-Asset_데이터구조기획.md의 해당 JSON/Markdown 구조를 확인한다.
```

### 3. Preflight Validation

작업 전 다음을 확인한다.

```text
- data/documents.json에 doc_id가 등록되어 있는가
- data/status/{doc_id}.json의 current_status가 작업 가능한 상태인가
- 필수 입력 Markdown/JSON이 존재하는가
- 이전 단계 agent-log가 필요한 경우 존재하는가
- 출력 폴더가 없으면 표준 경로에 맞게 생성 가능한가
- 동일 산출물이 이미 존재하면 덮어써도 되는 작업인지, revision이 필요한 작업인지 판단했는가
```

전제조건이 깨져 있으면 산출물을 억지로 만들지 않는다. `blocked` 또는 `error`로 보고한다.

### 4. Work Rules

```text
- 입력 파일을 먼저 읽고, 추정으로 작업하지 않는다.
- Markdown 원고는 사람이 읽을 수 있게 보존한다.
- JSON은 유효한 JSON으로 저장한다.
- 상태값은 04_번역워크플로우_운영매뉴얼.md의 내부 상태값만 사용한다.
- UX 표시 상태는 매뉴얼의 한글 표시 상태와 일치시킨다.
- 후보 상태는 candidate, approved, hold, rejected, deprecated만 사용한다.
- 감수자 메모 상태는 open, resolved, archived만 사용한다.
- timestamp는 가능하면 ISO 8601 형식으로 기록한다.
```

### 5. State Transition Rules

상태 전환은 임의로 건너뛰지 않는다.

```text
source_ready 없이 draft1_done으로 갈 수 없다.
draft1_done 없이 source_review_done으로 갈 수 없다.
source_review_done 없이 draft2_done으로 갈 수 없다.
draft2_done 없이 human_review_ready로 갈 수 없다.
human_editing 없이 draft3_handoff_ready로 갈 수 없다.
handoff 없이 draft3_generated로 갈 수 없다.
draft3_generated 없이 final_review로 갈 수 없다.
인간 승인 없이 final_done으로 갈 수 없다.
```

### 6. Agent Log Rules

모든 완료 로그는 다음 필드를 포함한다.

```json
{
  "log_id": "",
  "project_id": "",
  "doc_id": "",
  "agent_id": "",
  "agent_name": "",
  "stage": "",
  "input_files": [],
  "output_files": [],
  "summary": "",
  "issues": [],
  "requires_human_review": false,
  "next_recommended_action": "",
  "created_at": ""
}
```

`issues`는 비워둘 수 있지만, 불확실성이나 누락 가능성이 있으면 반드시 적는다. 완료 로그가 없으면 해당 단계는 완료로 보지 않는다.

### 7. Completion Comment Format

Paperclip task 완료 댓글은 간결하게 남긴다.

```markdown
Status: done

- Scope: {무엇을 처리했는지}
- Inputs: {확인한 주요 파일}
- Outputs: {생성/수정한 파일}
- Status change: {이전 상태 -> 다음 상태, 없으면 none}
- Issues: {남은 문제 또는 none}
- Next: {다음 권장 작업}
```

보류 또는 오류 댓글:

```markdown
Status: blocked

- Blocker: {진행 불가 이유}
- Missing/invalid: {없거나 잘못된 파일}
- Needed decision: {필요한 인간/매니저 판단}
- Next: {누가 무엇을 해야 하는지}
```

### 8. blocked vs error

`blocked`는 외부 판단이나 원문 확인 없이는 진행할 수 없는 상태이다.

```text
- 원문 출처 불명확
- 참고번역과 원문 혼입
- 문단 구조 불명확
- 인간 판단 필요
```

`error`는 단계 무결성이 깨진 상태이다.

```text
- 필수 파일 없음
- JSON 구조 오류
- handoff와 3차 번역본 불일치
- 에이전트 로그 누락
- 잘못된 단계 건너뛰기
```

둘 다 이유, 재현 정보, 다음 담당자를 기록한다.

## 금지

- 원문을 임의로 고치지 않는다.
- 인간 검수 없이 3차 반영 또는 최종 승인을 진행하지 않는다.
- 승인되지 않은 후보를 `approved`로 변경하지 않는다.
- handoff에 없는 후보를 B라인 산출물에 확정 반영하지 않는다.
- 불필요한 별도 Markdown 검토 파일을 양산하지 않는다.
- 출판, 웹 등록, 디자인, 온톨로지, 지식그래프 작업을 하지 않는다.
