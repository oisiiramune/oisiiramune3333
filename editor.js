(function () {
  window.addEventListener('DOMContentLoaded', function () {
    if (typeof require === 'undefined') {
      console.error('Monaco loader.js が読み込まれていません。');
      return;
    }

    require.config({
      paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.41.0/min/vs' }
    });

    require(['vs/editor/editor.main'], function () {

      const sampleCode = `// サンプル JavaScript
function greet(name) {
  console.log("Hello, " + name);
}
greet("World");`;

      const leftEditor = monaco.editor.create(document.getElementById('left'), {
        value: sampleCode,
        language: 'javascript',
        theme: 'vs-dark',
        readOnly: true,
        automaticLayout: true,
        lineNumbers: 'on'
      });

      const rightEditor = monaco.editor.create(document.getElementById('right'), {
        value: localStorage.getItem('userCode') || '',
        language: 'javascript',
        theme: 'vs-dark',
        automaticLayout: true,
        lineNumbers: 'on',
        autoClosingBrackets: 'always',
        autoClosingQuotes: 'always',
        suggestOnTriggerCharacters: true
      });

      const errorDisplay = document.getElementById('errorDisplay');

      // --- 構文チェック ---
      function checkSyntax() {
        const code = rightEditor.getValue();
        try {
          new Function(code);
          if (errorDisplay) errorDisplay.textContent = '';
        } catch (e) {
          if (errorDisplay) errorDisplay.textContent = `構文エラー: ${e.message}`;
        }
      }

      rightEditor.onDidChangeModelContent(() => {
        checkSyntax();
        localStorage.setItem('userCode', rightEditor.getValue());
      });

      // --- ボタンイベント ---
      function saveHandler() {
        const code = rightEditor.getValue();
        const fileName = prompt('保存するファイル名 (.js 推奨):');
        if (!fileName) { alert('ファイル名は必須'); return; }
        const blob = new Blob([code], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = (/\.(js|json)$/i).test(fileName) ? fileName : (fileName + '.js');
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          URL.revokeObjectURL(link.href);
          document.body.removeChild(link);
        }, 0);
      }

      async function loadHandler() {
        const maybeURL = prompt('GitHub のファイルURL（空欄ならローカル）:');
        if (maybeURL && maybeURL.trim()) {
          const rawURL = toRawGitHubURL(maybeURL.trim());
          try {
            const resp = await fetch(rawURL, { cache:'no-cache' });
            if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`);
            rightEditor.setValue(await resp.text());
            alert('GitHub から読み込みました');
          } catch(e) {
            alert('GitHub 読み込みエラー: ' + e.message);
          }
          return;
        }

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.js,.json,.txt';
        input.onchange = e => {
          const file = e.target.files && e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = () => rightEditor.setValue(reader.result || '');
            reader.readAsText(file);
          }
        };
        input.click();
      }

      function clearHandler() {
        if (confirm('本当にリセットしますか？')) {
          rightEditor.setValue('');
          localStorage.removeItem('userCode');
          if (errorDisplay) errorDisplay.textContent = '';
        }
      }

      function checkHandler() {
        const code = rightEditor.getValue();
        const findings = [];
        try { new Function(code); } catch(e) { findings.push(`構文エラー: ${e.message}`); }
        const bannedModules = ['@minecraft/server','@minecraft/server-ui','@minecraft/common'];
        for (const mod of bannedModules) {
          const re = new RegExp(mod.replace('/', '\\/'));
          if (re.test(code)) findings.push(`非対応モジュール: ${mod}`);
        }
        if (/require\s*\(/.test(code) || /\bimport\s+.+from\s+['"][^'"]+['"]/.test(code))
          findings.push('注意: import/require 含む（ブラウザ実行不可の可能性）');

        if (findings.length) alert('ScriptAPIチェック結果:\n' + findings.join('\n'));
        else alert('ScriptAPIチェック: エラーなし（簡易チェック）');
      }

      function toRawGitHubURL(u) {
        try {
          const url = new URL(u);
          if (url.hostname === 'github.com') {
            const parts = url.pathname.split('/').filter(Boolean);
            const [user, repo, blob, branch, ...rest] = parts;
            if (blob==='blob' && user && repo && branch && rest.length)
              return `https://raw.githubusercontent.com/${user}/${repo}/${branch}/${rest.join('/')}`;
          }
          return u;
        } catch { return u; }
      }

      // --- ボタンをIDで紐付け ---
      function bind(id, fn) {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', fn);
      }
      bind('saveBtn', saveHandler);
      bind('loadBtn', loadHandler);
      bind('clearBtn', clearHandler);
      bind('checkBtn', checkHandler);

      // 初回構文チェック
      checkSyntax();

      // --- コードとしての最後に ---
      try { if(typeof completion === 'function') completion(result); } catch(_){}
    });
  });
})();
