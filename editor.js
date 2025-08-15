(function () {
  // DOM 準備後に開始（HTMLの要素に確実にアクセスするため）
  window.addEventListener('DOMContentLoaded', function () {
    if (typeof require === 'undefined') {
      console.error('Monaco loader.js が読み込まれていません。index.html に loader.js を先に追加してください。');
      return;
    }

    // Monaco のパス設定（CDN）
    require.config({
      paths: {
        'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.41.0/min/vs'
      }
    });

    // Monaco 読み込み
    require(['vs/editor/editor.main'], function () {

      // --- エディタ生成 ---
      const sampleCode =
`// サンプル JavaScript
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

      // --- 構文チェック（右エディタ変更時に実行）---
      function checkSyntax() {
        const code = rightEditor.getValue();
        try {
          // 構文だけチェック（実行はしない）
          new Function(code);
          if (errorDisplay) errorDisplay.textContent = '';
        } catch (e) {
          if (errorDisplay) errorDisplay.textContent = `構文エラー: ${e.message}`;
        }
      }

      rightEditor.onDidChangeModelContent(() => {
        checkSyntax();
        // 自動保存
        localStorage.setItem('userCode', rightEditor.getValue());
      });

      // --- ユーティリティ ---
      function toRawGitHubURL(u) {
        try {
          const url = new URL(u);
          if (url.hostname === 'github.com') {
            // 形式: https://github.com/user/repo/blob/branch/path/to/file
            const parts = url.pathname.split('/').filter(Boolean);
            const [user, repo, blob, branch, ...rest] = parts;
            if (blob === 'blob' && user && repo && branch && rest.length) {
              return `https://raw.githubusercontent.com/${user}/${repo}/${branch}/${rest.join('/')}`;
            }
          }
          return u; // すでに raw.githubusercontent.com などの場合はそのまま
        } catch {
          return u;
        }
      }

      function bind(id, fn) {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', fn, { passive: true });
      }

      // --- ボタン処理（関数定義） ---
      function saveHandler() {
        const code = rightEditor.getValue();
        const fileName = prompt('保存するファイル名を入力してください（.js 推奨）:');
        if (!fileName) {
          alert('ファイル名は必須です！');
          return;
        }
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
        // GitHub から読み込みたい場合は URL を入力。空ならローカルファイル選択。
        const maybeURL = prompt('GitHub のファイルURL（空欄ならローカルファイルを選択）:');
        if (maybeURL && maybeURL.trim()) {
          const rawURL = toRawGitHubURL(maybeURL.trim());
          try {
            const resp = await fetch(rawURL, { cache: 'no-cache' });
            if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`);
            const text = await resp.text();
            rightEditor.setValue(text);
            alert('GitHub から読み込みました');
          } catch (e) {
            alert('GitHub 読み込みエラー: ' + e.message);
          }
          return;
        }

        // ローカルファイル
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.js,.json,.txt';
        input.onchange = e => {
          const file = e.target.files && e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = () => rightEditor.setValue(String(reader.result || ''));
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

        // 1) 構文エラー
        try {
          new Function(code);
        } catch (e) {
          findings.push(`構文エラー: ${e.message}`);
        }

        // 2) 非対応（想定）モジュールの静的検出（簡易）
        const bannedModules = [
          '@minecraft/server',
          '@minecraft/server-ui',
          '@minecraft/common'
        ];
        for (const mod of bannedModules) {
          const re = new RegExp(mod.replace('/', '\\/'));
          if (re.test(code)) {
            findings.push(`非対応モジュール参照: ${mod}`);
          }
        }

        // 3) 非対応っぽい import/require の簡易検出
        if (/require\s*\(/.test(code) || /\bimport\s+.+from\s+['"][^'"]+['"]/.test(code)) {
          // ブラウザ直実行は不可な場合が多いので注意喚起
          findings.push('注意: import/require を含みます（ブラウザ直実行不可の可能性）');
        }

        if (findings.length) {
          alert('ScriptAPIチェック結果:\n' + findings.join('\n'));
        } else {
          alert('ScriptAPIチェック: エラーなし（静的・簡易検査）');
        }
      }

      // --- グローバル公開（HTML の onclick でも動くように） ---
      window.saveCode = saveHandler;
      window.loadCode = loadHandler;
      window.clearEditor = clearHandler;
      window.toggleScriptAPI = checkHandler;

      // --- ID がある場合はイベントで紐付け（CSP対策） ---
      bind('saveBtn', saveHandler);
      bind('loadBtn', loadHandler);
      bind('clearBtn', clearHandler);
      bind('checkBtn', checkHandler);

      // 初回の構文チェック
      checkSyntax();

      // --- コードとしての最後に ---
      try {
        if (typeof completion === 'function') {
          completion(result);
        }
      } catch (_) {
        // result 未定義などでも落とさない
      }
    });
  });
})();
