document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('submissions-root');
  if (!root) return;

  if (location.protocol === 'file:') {
    root.innerHTML = `
      <div class="error">
        名簿の読み込みに失敗しました（file:// プロトコルでは fetch がブロックされます）。<br>
        ローカルで確認するには、プロジェクトフォルダでローカル HTTP サーバを起動して
        <a href="http://localhost:8000" target="_blank" rel="noopener">http://localhost:8000</a> で開いてください。<br>
        例（cmd.exe / PowerShell）:
        <pre>python -m http.server 8000</pre>
      </div>
    `;
    return;
  }

  function renderFromIds(ids) {
    if (!Array.isArray(ids) || ids.length === 0) {
      root.innerHTML = '<em>名簿が空です。</em>';
      return;
    }

    const groups = {};
    for (const id of ids) {
      const s = String(id).trim();
      if (!/^\d{4}$/.test(s)) continue;
      const key = s.slice(0,2);
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    }

    const sortedKeys = Object.keys(groups).sort((a,b) => Number(a)-Number(b));
    for (const key of sortedKeys) {
      const idsInGroup = groups[key].sort((a,b)=>Number(a)-Number(b));
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
        a.href = `./${id}/sample.html`;
        a.textContent = id.slice(2);
        a.setAttribute('data-id', id);
        grid.appendChild(a);
      }

      block.appendChild(grid);
      root.appendChild(block);
    }
  }

  fetch('./roster.json')
    .then(res => {
      if (!res.ok) throw new Error(`roster.json: ${res.status} ${res.statusText}`);
      return res.json();
    })
    .then(json => {
      renderFromIds(json);
    })
    .catch(errJson => {
      console.warn('roster.json failed, falling back to roster.md:', errJson);
      fetch('./roster.md')
        .then(res => {
          if (!res.ok) throw new Error(`roster.md: ${res.status} ${res.statusText}`);
          return res.text();
        })
        .then(text => {
          const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#'));
          renderFromIds(lines);
        })
        .catch(err => {
          console.error(err);
          const msg = document.createElement('div');
          msg.className = 'error';
          msg.innerHTML = `名簿の読み込みに失敗しました。<br><small>${(err && err.message) || err}</small>`;
          root.innerHTML = '';
          root.appendChild(msg);
        });
    });
});
