// ...existing code...
document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('submissions-root');
  if (!root) return;

  function showError(message) {
    root.innerHTML = '';
    const box = document.createElement('div');
    box.className = 'error';
    box.textContent = message;
    root.appendChild(box);
  }

  if (location.protocol === 'file:') {
    root.innerHTML = ''; 
    const box = document.createElement('div');
    box.className = 'error';
    const p1 = document.createElement('p');
    p1.textContent = '名簿の読み込みに失敗しました（file:// プロトコルでは fetch がブロックされます）。';
    const p2 = document.createElement('p');
    p2.textContent = 'ローカルで確認するには、プロジェクトフォルダでローカル HTTP サーバを起動して http://localhost:8000 で開いてください。';
    const pre = document.createElement('pre');
    pre.textContent = 'python -m http.server 8000';
    const a = document.createElement('a');
    a.href = 'http://localhost:8000';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = 'http://localhost:8000';
    box.appendChild(p1);
    box.appendChild(p2);
    box.appendChild(pre);
    const p3 = document.createElement('p');
    p3.appendChild(document.createTextNode('開く: '));
    p3.appendChild(a);
    box.appendChild(p3);
    root.appendChild(box);
    return;
  }

  function renderFromIds(ids) {
    root.innerHTML = ''; 
    if (!Array.isArray(ids) || ids.length === 0) {
      const em = document.createElement('em');
      em.textContent = '名簿が空です。';
      root.appendChild(em);
      return;
    }

    const groups = {};
    for (const id of ids) {
      const s = String(id).trim();
      if (!/^\d{4}$/.test(s)) continue; 
      const key = s.slice(0, 2);
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    }

    const sortedKeys = Object.keys(groups).sort((a, b) => Number(a) - Number(b));
    for (const key of sortedKeys) {
      const idsInGroup = groups[key].sort((a, b) => Number(a) - Number(b));
      const year = key.charAt(0);
      const cls = key.charAt(1);

      const block = document.createElement('div');
      block.className = 'class-block';

      const title = document.createElement('h3');
      title.textContent = `${year}年 ${cls}組`;
      block.appendChild(title);

      const grid = document.createElement('div');
      grid.className = 'student-grid';

      for (const id of idsInGroup) {
        const a = document.createElement('a');
        a.className = 'student-link';
        a.href = `./${encodeURIComponent(id)}/sample.html`;
        a.textContent = id.slice(2);
        a.setAttribute('data-id', id);
        grid.appendChild(a);
      }

      block.appendChild(grid);
      root.appendChild(block);
    }
  }

  (function fetchRoster() {
    const controller = new AbortController();
    const TIMEOUT_MS = 8000;
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    fetch('./roster.json', { signal: controller.signal })
      .then(res => {
        clearTimeout(timeout);
        if (!res.ok) throw new Error(`roster.json: ${res.status} ${res.statusText}`);
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) {
          if (!ct.includes('+json')) throw new Error('roster.json: invalid content-type');
        }
        return res.json();
      })
      .then(json => {
        if (!Array.isArray(json)) throw new Error('roster.json: expected array');
        if (json.length > 5000) throw new Error('roster.json: too many entries');
        renderFromIds(json);
      })
      .catch(err => {
        console.error('Roster load error:', err);
        showError('名簿の読み込みに失敗しました。ページをサーバー経由で開くか、管理者に連絡してください。');
      });
  })();

});