# Init Task: 00-총괄 번역 디렉터-법장

이 문서는 Paperclip에서 `00-총괄 번역 디렉터-법장`에게 처음 할당하는 OL-DESK-CREW 초기화 지시서이다.

목표는 번역 실행이 아니라 **AI-Agent 조직 구성**이다. 총괄 디렉터는 A/B 매니저 2명을 생성하고, 각 매니저가 자기 라인의 세부 에이전트를 고용하도록 위임한다. 실제 원문 처리, 산출물 생성, 로그 생성 검증은 별도 테스트 task에서 진행한다.

---

## 1. 기준 매뉴얼

앞으로 OL-DESK-CREW 관련 기준 문서는 `ol-desk-crew/manual/` 아래 문서를 사용한다.

```text
ol-desk-crew/manual/00_OL-CREW_전체기획.md
ol-desk-crew/manual/01_OL-DESK_개발기획.md
ol-desk-crew/manual/02_Contents-Asset_데이터구조기획.md
ol-desk-crew/manual/03_AI-Agent_운영기획.md
ol-desk-crew/manual/04_번역워크플로우_운영매뉴얼.md
```

외부 매뉴얼 경로를 직접 참조하지 않는다. 필요한 경우 위 로컬 복사본을 기준으로 판단한다.

---

## 2. 초기화 원칙

초기화 task에서 하는 일:

```text
1. 총괄 디렉터 지침 확인
2. A00/B00 매니저 생성 또는 확인
3. A00에게 A라인 세부 에이전트 고용 task 위임
4. B00에게 B라인 세부 에이전트 고용 task 위임
5. 각 매니저에게 세부 에이전트 지침 경로 전달
6. 조직 구성 결과를 Paperclip Issue 댓글로 보고
7. Issue 상태창 언어는 한국어로 기본 설정
```

초기화 task에서 하지 않는 일:

```text
- raw 원문 처리
- documents.json/status JSON 생성
- source normalization
- draft1/draft2/draft3/draft4 생성
- handoff 생성
- agent-log 생산 검증
- 대량 batch 실행
- 테스트 원문 작업 시작
```

에이전트 생성과 실제 작업 실행은 분리한다. 초기화가 끝난 뒤, 별도 테스트 task에서 원문 1개를 대상으로 산출물과 로그 생산을 검증한다.

---

## 3. 조직 구조

OL-DESK-CREW는 `03_AI-Agent_운영기획.md`의 A/B 매니저 구조를 따른다.

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
   │
   └─ B00-3차 확정 관리 매니저-결정
      ├─ B01-인간검수 준비 에이전트-청문
      ├─ B02-3차 반영 에이전트-정반
      ├─ B03-최종스캔 에이전트-무루
      └─ B04-최종탈고 인계 에이전트-회향
```

---

## 4. 지침 문서 경로

### 공통 지침

```text
ol-desk-crew/ai-agent/COMMON.md
```

### 총괄 디렉터와 매니저

```text
00-총괄 번역 디렉터-법장
ol-desk-crew/ai-agent/company/00-director-beopjang/AGENTS.md

A00-2차 생산 관리 매니저-선행
ol-desk-crew/ai-agent/company/A00-manager-seonhaeng/AGENTS.md

B00-3차 확정 관리 매니저-결정
ol-desk-crew/ai-agent/company/B00-manager-gyeoljeong/AGENTS.md
```

### A라인 세부 에이전트

```text
A01-기초 정리 에이전트-정안
ol-desk-crew/ai-agent/agents/A-line/A01-jeongan/AGENTS.md

A02-참고번역 분리 에이전트-분명
ol-desk-crew/ai-agent/agents/A-line/A02-bunmyeong/AGENTS.md

A03-용어 후보 에이전트-명해
ol-desk-crew/ai-agent/agents/A-line/A03-myeonghae/AGENTS.md

A04-1차 번역 에이전트-초역
ol-desk-crew/ai-agent/agents/A-line/A04-choyeok/AGENTS.md

A05-원문대조 감수 에이전트-조견
ol-desk-crew/ai-agent/agents/A-line/A05-jogyeon/AGENTS.md

A06-각주 후보 에이전트-해의
ol-desk-crew/ai-agent/agents/A-line/A06-haeui/AGENTS.md

A07-2차 번역 에이전트-윤문
ol-desk-crew/ai-agent/agents/A-line/A07-yunmun/AGENTS.md
```

### B라인 세부 에이전트

```text
B01-인간검수 준비 에이전트-청문
ol-desk-crew/ai-agent/agents/B-line/B01-cheongmun/AGENTS.md

B02-3차 반영 에이전트-정반
ol-desk-crew/ai-agent/agents/B-line/B02-jeongban/AGENTS.md

B03-최종스캔 에이전트-무루
ol-desk-crew/ai-agent/agents/B-line/B03-muru/AGENTS.md

B04-최종탈고 인계 에이전트-회향
ol-desk-crew/ai-agent/agents/B-line/B04-hoehyang/AGENTS.md
```

---

## 5. 총괄 디렉터 실행 순서

### Step 1. 기준 문서 확인

디렉터는 먼저 다음 문서를 읽는다.

```text
ol-desk-crew/ai-agent/COMMON.md
ol-desk-crew/ai-agent/company/00-director-beopjang/AGENTS.md
ol-desk-crew/manual/00_OL-CREW_전체기획.md
ol-desk-crew/manual/03_AI-Agent_운영기획.md
ol-desk-crew/manual/04_번역워크플로우_운영매뉴얼.md
```

### Step 2. A00/B00 매니저 생성 또는 확인

디렉터는 다음 2개 매니저 에이전트를 생성 또는 확인한다.

```text
A00-2차 생산 관리 매니저-선행
B00-3차 확정 관리 매니저-결정
```

각 매니저 생성 시 해당 `AGENTS.md` 경로를 설명에 포함한다.

### Step 3. A00에게 A라인 고용 task 위임

디렉터는 A00에게 child task를 만든다.

```markdown
Objective: A라인 세부 에이전트 고용 및 지침 연결

Owner: A00-2차 생산 관리 매니저-선행

Required hires:
- A01-기초 정리 에이전트-정안
- A02-참고번역 분리 에이전트-분명
- A03-용어 후보 에이전트-명해
- A04-1차 번역 에이전트-초역
- A05-원문대조 감수 에이전트-조견
- A06-각주 후보 에이전트-해의
- A07-2차 번역 에이전트-윤문

Instruction paths:
- ol-desk-crew/ai-agent/agents/A-line/A01-jeongan/AGENTS.md
- ol-desk-crew/ai-agent/agents/A-line/A02-bunmyeong/AGENTS.md
- ol-desk-crew/ai-agent/agents/A-line/A03-myeonghae/AGENTS.md
- ol-desk-crew/ai-agent/agents/A-line/A04-choyeok/AGENTS.md
- ol-desk-crew/ai-agent/agents/A-line/A05-jogyeon/AGENTS.md
- ol-desk-crew/ai-agent/agents/A-line/A06-haeui/AGENTS.md
- ol-desk-crew/ai-agent/agents/A-line/A07-yunmun/AGENTS.md

Acceptance criteria:
- A01-A07이 생성 또는 확인됨
- 각 에이전트 설명에 올바른 지침 경로가 포함됨
- 실제 원문 작업 task는 생성하지 않음
- 완료 댓글에 agent name, Paperclip agent id, instruction path를 보고
```

### Step 4. B00에게 B라인 고용 task 위임

디렉터는 B00에게 child task를 만든다.

```markdown
Objective: B라인 세부 에이전트 고용 및 지침 연결

Owner: B00-3차 확정 관리 매니저-결정

Required hires:
- B01-인간검수 준비 에이전트-청문
- B02-3차 반영 에이전트-정반
- B03-최종스캔 에이전트-무루
- B04-최종탈고 인계 에이전트-회향

Instruction paths:
- ol-desk-crew/ai-agent/agents/B-line/B01-cheongmun/AGENTS.md
- ol-desk-crew/ai-agent/agents/B-line/B02-jeongban/AGENTS.md
- ol-desk-crew/ai-agent/agents/B-line/B03-muru/AGENTS.md
- ol-desk-crew/ai-agent/agents/B-line/B04-hoehyang/AGENTS.md

Acceptance criteria:
- B01-B04가 생성 또는 확인됨
- 각 에이전트 설명에 올바른 지침 경로가 포함됨
- 실제 handoff, draft3, final scan 작업 task는 생성하지 않음
- 완료 댓글에 agent name, Paperclip agent id, instruction path를 보고
```

### Step 5. 디렉터 parent issue 상태 보고

디렉터는 A00/B00 고용 task를 만든 뒤 parent issue에 댓글을 남긴다.

```markdown
Status: in_review

- Scope: initialized OL-DESK-CREW manager layer
- Managers:
  - A00-2차 생산 관리 매니저-선행
  - B00-3차 확정 관리 매니저-결정
- Delegated:
  - A00: hire A01-A07 and attach instruction paths
  - B00: hire B01-B04 and attach instruction paths
- Execution tasks created: none
- Files changed: none
- Next: wait for A00/B00 hiring reports, then prepare a separate test task for one source document
```

---

## 6. 완료 기준

이 init task는 다음 조건을 만족하면 완료다.

```text
1. 디렉터가 공통 지침과 로컬 manual 기준 문서를 확인했다.
2. A00/B00 매니저가 생성 또는 확인되었다.
3. A00에게 A01-A07 고용 task가 위임되었다.
4. B00에게 B01-B04 고용 task가 위임되었다.
5. 각 child task에 세부 에이전트 지침 경로가 포함되었다.
6. 원문 처리, 번역, status JSON 생성, handoff 생성 등 실행 작업은 시작하지 않았다.
7. parent issue에 현재 상태와 다음 단계가 댓글로 보고되었다.
```

---

## 7. 다음 단계

초기화 완료 후 다음 작업은 별도 issue로 만든다.

```text
테스트 task:
- 테스트 원본 1개 선택
- A01부터 필요한 단계만 순차 실행
- Markdown 산출물 생성 확인
- JSON 상태/메모/handoff 구조 확인
- agent-log 생산 확인
- Paperclip Issue 댓글 기록 품질 확인
```

테스트 task 전에는 대량 batch를 만들지 않는다. 테스트 원본 1개로 실제 작업 흐름과 산출물 품질을 먼저 검증한다.
