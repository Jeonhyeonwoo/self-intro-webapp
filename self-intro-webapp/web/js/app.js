(function () {
  'use strict';

  // S04에 표시할 이메일 주소
  const CONTACT_EMAIL = 'pjh7348@hanyang.ac.kr';

  const PAGE_SIZE = 10;

  // ---------- 작은 도우미 ----------
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text; // 항상 글자 그대로 넣습니다 (HTML로 해석하지 않음)
    return node;
  }
  const $ = (id) => document.getElementById(id);

  // ---------- S04 연락처 ----------
  $('email-text').textContent = CONTACT_EMAIL;
  $('mail-link').href = 'mailto:' + CONTACT_EMAIL;

  // ---------- S03 프로젝트 목록 ----------
  async function renderProjects() {
    const list = $('project-list');
    try {
      const projects = await window.api.listProjects();
      list.replaceChildren();
      projects.forEach((p) => {
        const card = el('article', 'card');
        card.appendChild(el('h3', null, p.title));
        card.appendChild(el('p', 'period', p.period));

        const dl = el('dl');
        const roleBox = el('div');
        roleBox.appendChild(el('dt', null, '담당 역할'));
        roleBox.appendChild(el('dd', null, p.role));
        const resultBox = el('div');
        resultBox.appendChild(el('dt', null, '결과'));
        resultBox.appendChild(el('dd', null, p.result));
        dl.append(roleBox, resultBox);
        card.appendChild(dl);

        const btn = el('button', 'btn btn-small', '자세히 보기');
        btn.type = 'button';
        btn.addEventListener('click', () => openProject(p.id, btn));
        card.appendChild(btn);

        list.appendChild(card);
      });
    } catch (err) {
      list.replaceChildren(el('p', 'muted', '프로젝트를 불러오지 못했습니다.'));
      console.error(err);
    }
  }

  // ---------- 기능 1: 프로젝트 자세히 보기 ----------
  const modal = $('modal');
  const modalBody = $('modal-body');
  let lastTrigger = null;

  async function openProject(id, trigger) {
    if (!modal.hidden) return; // 한 번에 하나의 상세 창만 엽니다
    lastTrigger = trigger;
    try {
      const p = await window.api.getProject(id);
      modalBody.replaceChildren(buildDetail(p));
      modal.hidden = false;
      document.body.classList.add('modal-open');
      $('modal-close').focus();
    } catch (err) {
      alert('프로젝트 정보를 불러오지 못했습니다.');
      console.error(err);
    }
  }

  function buildDetail(p) {
    const wrap = el('div');
    const title = el('h3', null, p.title);
    title.id = 'modal-title';
    wrap.appendChild(title);
    wrap.appendChild(el('p', 'period', p.period));

    const summary = el('dl', 'summary');
    [['담당 역할', p.role], ['결과', p.result]].forEach(([label, value]) => {
      const row = el('div');
      row.appendChild(el('dt', null, label));
      row.appendChild(el('dd', null, value));
      summary.appendChild(row);
    });
    wrap.appendChild(summary);

    p.details.forEach((section) => {
      wrap.appendChild(el('h4', null, section.heading));
      const ul = el('ul');
      section.items.forEach((item) => ul.appendChild(el('li', null, item)));
      wrap.appendChild(ul);
    });

    if (p.videos && p.videos.length) {
      wrap.appendChild(el('h4', null, '시연 영상'));
      p.videos.forEach((v) => {
        const fig = el('figure', 'video-wrap');
        const video = document.createElement('video');
        video.controls = true;          // 자동 재생하지 않고 방문자가 직접 재생합니다
        video.preload = 'none';
        video.setAttribute('playsinline', '');
        video.src = v.src;
        fig.appendChild(video);
        fig.appendChild(el('figcaption', null, v.caption));
        wrap.appendChild(fig);
      });
    }
    return wrap;
  }

  function closeProject() {
    if (modal.hidden) return;
    modalBody.querySelectorAll('video').forEach((v) => v.pause());
    modal.hidden = true;
    modalBody.replaceChildren();
    document.body.classList.remove('modal-open');
    if (lastTrigger) lastTrigger.focus(); // 목록의 원래 위치로 돌아옵니다
  }

  $('modal-close').addEventListener('click', closeProject);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeProject(); });
  document.addEventListener('keydown', (e) => {
    if (modal.hidden) return;
    if (e.key === 'Escape') { closeProject(); return; }
    if (e.key === 'Tab') {
      // 상세 창 안에서만 Tab 이동
      const focusables = modal.querySelectorAll('button, video[controls], [href], input, textarea, [tabindex]:not([tabindex="-1"])');
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // ---------- S05 방명록 ----------
  const form = $('guestbook-form');
  const nameInput = $('gb-name');
  const messageInput = $('gb-message');
  const submitBtn = $('gb-submit');
  const statusEl = $('gb-status');
  const listEl = $('gb-list');
  const emptyEl = $('gb-empty');
  const moreBtn = $('gb-more');
  let nextToken = null;

  function setStatus(text, kind) {
    statusEl.textContent = text;
    statusEl.className = 'status' + (kind ? ' ' + kind : '');
  }

  function updateCounts() {
    $('gb-name-count').textContent = nameInput.value.length + '/20';
    $('gb-message-count').textContent = messageInput.value.length + '/200';
  }
  nameInput.addEventListener('input', updateCounts);
  messageInput.addEventListener('input', updateCounts);

  function formatTime(iso) {
    return new Date(iso).toLocaleString('ko-KR', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  }

  function renderGuestbookItem(item) {
    const li = el('li', 'gb-item');
    const head = el('div', 'gb-head');
    head.appendChild(el('span', 'gb-name', item.name));
    head.appendChild(el('span', 'gb-time', formatTime(item.createdAt)));
    li.appendChild(head);
    li.appendChild(el('p', 'gb-msg', item.message));
    return li;
  }

  // 기능 3: 방명록 목록 조회 (최신순, 10개씩)
  async function loadGuestbook(reset) {
    try {
      if (reset) { listEl.replaceChildren(); nextToken = null; }
      const res = await window.api.listGuestbook({ limit: PAGE_SIZE, nextToken });
      res.items.forEach((item) => listEl.appendChild(renderGuestbookItem(item)));
      nextToken = res.nextToken;
      moreBtn.hidden = !nextToken;
      emptyEl.hidden = listEl.children.length > 0;
    } catch (err) {
      setStatus('방명록을 불러오지 못했습니다.', 'error');
      console.error(err);
    }
  }
  moreBtn.addEventListener('click', () => loadGuestbook(false));

  // 기능 2: 방명록 작성
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (submitBtn.disabled) return; // 중복 등록 방지

    const name = nameInput.value.trim();
    const message = messageInput.value.trim();
    if (name.length < 1 || name.length > 20) { setStatus('이름은 1~20자로 입력해주세요.', 'error'); nameInput.focus(); return; }
    if (message.length < 1 || message.length > 200) { setStatus('메시지는 1~200자로 입력해주세요.', 'error'); messageInput.focus(); return; }

    submitBtn.disabled = true;
    submitBtn.textContent = '저장 중...';
    setStatus('');
    try {
      await window.api.createGuestbook({ name, message });
      form.reset();
      updateCounts();
      setStatus('방명록이 등록되었습니다.', 'ok');
      await loadGuestbook(true); // 새 글이 맨 위에 나타납니다
    } catch (err) {
      // 실패하면 입력 내용은 그대로 남겨둡니다
      setStatus('등록에 실패했습니다: ' + err.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '남기기';
    }
  });

  // ---------- 시작 ----------
  renderProjects();
  loadGuestbook(true);
})();
