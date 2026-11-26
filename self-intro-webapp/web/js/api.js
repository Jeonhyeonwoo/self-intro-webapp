// 데이터 접근 계층
// 프로젝트 정보는 이 파일의 샘플 데이터를 쓰고,
// 방명록은 AppSync(GraphQL) → DynamoDB를 호출합니다.
// 엔드포인트와 API 키는 js/config.js 에서 읽습니다. (화면 코드는 window.api의 네 함수만 사용)
(function () {
  'use strict';

  const PROJECTS = [
    {
      id: 'patchgap',
      title: 'PatchGap: Robotic Vehicle 소프트웨어에 보고된 버그의 패치 완결성 측정 연구',
      period: '2026.07 ~ 진행 중',
      role: '연구 전 과정 수행 (사례 재구성, 수작업 검증, 분석 도구 구현, 논문 작성), 지도교수 지도',
      result: '보고된 버그 리포트 207건 중 60.9%가 아직 완전히 수정되지 않았음을 확인했고, 논문을 ACK2026, ICEIC2027에 제출했습니다.',
      videos: [],
      details: [
        {
          heading: '연구 방법',
          items: [
            'ArduPilot, PX4, Paparazzi에서 PGFuzz가 보고한 버그 리포트 207건을 66개 사례로 재구성',
            '소스 코드 직접 분석과 SITL 재현으로 수작업 검증한 뒤 완전수정, 부분수정, 미수정, 제외, 판정보류 5단계로 분류',
            '결정론적 정적 분석 도구로 같은 판정을 다시 검증하는 자동 교차검증'
          ]
        },
        {
          heading: '핵심 수치',
          items: [
            '207건 중 미수정 66건과 부분수정 60건, 합계 126건(60.9%)이 위험을 완전히 제거하지 못한 상태',
            '자동화 도구는 정의를 찾은 163개 파라미터의 77.9%를 정확히 판정했고 나머지는 판정보류로 두어 오판정 0건',
            '개발에 쓰지 않은 ADGFuzz 사례 17건의 독립 검증에서는 5건을 오판정해 판정 규칙의 보완점을 확인'
          ]
        },
        {
          heading: '논문',
          items: ['ACK2026, ICEIC2027에 제출']
        }
      ]
    },
    {
      id: 'space-invaders',
      title: 'Space Invaders 팀 협업 개발 (소프트웨어개발실무)',
      period: '한 학기',
      role: 'Main menu / Setting 파트 개발 (마우스 조작 지원, 버튼 클릭 효과음), 팀 협업 워크플로 설계 참여',
      result: '팀 기능을 도움말, HUD 버튼, 사운드, 설정 UI, 화면 크기 조절로 세분화해 개발하고 시연 영상으로 제출했습니다.',
      videos: [
        { src: 'media/space-invaders-menu.mp4', caption: '메인 메뉴 시연 (마우스 조작)' },
        { src: 'media/space-invaders-settings.mp4', caption: '설정 화면 시연 (화면 크기, 사운드, HUD 옵션, 도움말)' }
      ],
      details: [
        {
          heading: '담당 파트',
          items: [
            'Main menu / Setting 파트 개발',
            '마우스로 메뉴를 선택하는 조작 지원',
            '버튼을 누르면 효과음 재생'
          ]
        },
        {
          heading: '협업 방식',
          items: [
            'GitLab Flow 기반, 브랜치 이름은 fea_기능이름',
            '커밋 메시지는 SDP-01 [FIX] 파일명 설명 형식 (fix, improve, add, implement, support 키워드)',
            'Jira로 이슈 관리, Jenkins 사용, 스크럼반(Scrumban) 프로세스',
            'Java 16으로 버전 통일'
          ]
        },
        {
          heading: '소통 방식',
          items: [
            '매주 수요일 정기회의, 회의록은 Notion에 정리, 서기는 주마다 교대',
            '카카오톡에서 중요한 메시지가 묻히는 문제가 있어 논의는 Slack 스레드로 이동',
            '충돌이 나면 직전 커밋자와 함께 해결하고, merge 전에는 작업자들에게 먼저 알림'
          ]
        }
      ]
    }
  ];

  // js/config.js 가 window.APP_CONFIG = { APPSYNC_URL, APPSYNC_API_KEY } 를 정의합니다.
  async function gql(query, variables) {
    const cfg = window.APP_CONFIG;
    if (!cfg || !cfg.APPSYNC_URL || !cfg.APPSYNC_API_KEY) {
      throw new Error('config.js 설정이 없습니다.');
    }
    let res;
    try {
      res = await fetch(cfg.APPSYNC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': cfg.APPSYNC_API_KEY },
        body: JSON.stringify({ query, variables })
      });
    } catch (e) {
      throw new Error('서버에 연결할 수 없습니다.');
    }
    let body = null;
    try { body = await res.json(); } catch (e) { /* JSON이 아닌 응답 */ }
    if (body && body.errors && body.errors.length) {
      throw new Error(body.errors[0].message);
    }
    if (!res.ok || !body) {
      throw new Error('요청에 실패했습니다. (HTTP ' + res.status + ')');
    }
    return body.data;
  }

  const LIST_QUERY = `query ($limit: Int, $nextToken: String) {
    listGuestbook(limit: $limit, nextToken: $nextToken) {
      items { id name message createdAt }
      nextToken
    }
  }`;

  const CREATE_MUTATION = `mutation ($name: String!, $message: String!) {
    createGuestbook(name: $name, message: $message) {
      id name message createdAt
    }
  }`;

  window.api = {
    // 프로젝트 카드 목록 (S03)
    async listProjects() {
      return PROJECTS.map(({ id, title, period, role, result }) => ({ id, title, period, role, result }));
    },

    // 프로젝트 상세 (기능 1)
    async getProject(id) {
      const found = PROJECTS.find((p) => p.id === id);
      if (!found) throw new Error('프로젝트를 찾을 수 없습니다.');
      return found;
    },

    // 방명록 목록, 최신순 (기능 3)
    async listGuestbook({ limit = 10, nextToken = null } = {}) {
      const data = await gql(LIST_QUERY, { limit, nextToken });
      return data.listGuestbook;
    },

    // 방명록 저장 (기능 2)
    async createGuestbook({ name, message }) {
      const data = await gql(CREATE_MUTATION, {
        name: String(name || '').trim(),
        message: String(message || '').trim()
      });
      return data.createGuestbook;
    }
  };
})();
