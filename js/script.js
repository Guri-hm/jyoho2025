document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('submissions-root');
  if (!root) return;

  // fetch roster.md, parse IDs (one per line), ignore comments and blank lines
  fetch('./roster.md')
    .then(res => {
      if (!res.ok) throw new Error('Failed to load roster.md');
      return res.text();
    })
    .then(text => {
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#'));
      if (lines.length === 0) {
        root.innerHTML = '<em>名簿が空です。</em>';
        return;
      }

      // group by first two digits (e.g. 21 -> 2年1組)
      const groups = {};
      for (const id of lines) {
        if (!/^\d{4}$/.test(id)) continue; // skip invalid
        const key = id.slice(0,2);
        if (!groups[key]) groups[key] = [];
        groups[key].push(id);
      }

      // sort group keys numerically
      const sortedKeys = Object.keys(groups).sort((a,b) => Number(a) - Number(b));

      // build DOM for each group
      for (const key of sortedKeys) {
        const ids = groups[key].sort((a,b) => Number(a) - Number(b));

        // derive human readable title: year = first digit, class = second digit
        const year = key.charAt(0);
        const cls = key.charAt(1);

        const block = document.createElement('div');
        block.className = 'class-block';

        const title = document.createElement('h3');
        title.textContent = `${year}年 ${cls}組`;
        block.appendChild(title);

        const grid = document.createElement('div');
        grid.className = 'student-grid';

        for (const id of ids) {
          const a = document.createElement('a');
          a.className = 'student-link';
          // href points to folder/<sample.html>
          a.href = `./${id}/sample.html`;
          // display last two digits as student number
          a.textContent = id.slice(2);
          a.setAttribute('data-id', id);
          grid.appendChild(a);
        }

        block.appendChild(grid);
        root.appendChild(block);
      }
    })
    .catch(err => {
      console.error(err);
      root.innerHTML = '<div class="error">名簿の読み込みに失敗しました。</div>';
    });
});
