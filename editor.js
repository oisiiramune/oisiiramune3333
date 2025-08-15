document.addEventListener('DOMContentLoaded', function () {
  if (typeof require === 'undefined') {
    console.error('Monaco loader.js が読み込まれていません。');
    return;
  }

  require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.41.0/min/vs' }});

  require(['vs/editor/editor.main'], function () {
    const sampleCode = `// サンプル JavaScript
function greet(name) {
  console.log("Hello, " + name);
}
greet("World");`;

    // 左：サンプルコード
    const leftEditor = monaco.editor.create(document.getElementById('left'), {
      value: sampleCode,
      language: 'javascript',
      theme: 'vs-dark',
      readOnly: true,
      automaticLayout: true,
      lineNumbers: 'on'
    });

    // 右：ユーザー編集エリア
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

    // JS構文チェック
    function checkSyntax() {
      const code = rightEditor.getValue();
      try {
        new Function(code);
        errorDisplay.textContent = '';
      } catch (e) {
        errorDisplay.textContent = `構文エラー: ${e.message}`;
      }
    }

    // ScriptAPIチェック（常時）
    function checkScriptAPI() {
      const code = rightEditor.getValue();
      const findings = [];

      try { new Function(code); } catch(e) { findings.push('構文エラー: '+e.message); }

      const bannedModules = ['@minecraft/server','@minecraft/server-ui','@minecraft/common'];
      bannedModules.forEach(mod => { if(code.includes(mod)) findings.push('非対応モジュール: '+mod); });

      if(/require\s*\(/.test(code) || /\bimport\s+.+from\s+['"][^'"]+['"]/.test(code)) {
        findings.push('注意: import/require 含む');
      }

      errorDisplay.textContent = findings.length ? findings.join('\n') : 'ScriptAPIチェック: エラーなし';
    }

    // 自動保存 & 常時チェック
    rightEditor.onDidChangeModelContent(() => {
      localStorage.setItem('userCode', rightEditor.getValue());
      checkSyntax();
      checkScriptAPI();
    });

    // 初回チェック
    checkSyntax();
    checkScriptAPI();

    // ボタンイベント
    document.getElementById('saveBtn').addEventListener('click', function () {
      const code = rightEditor.getValue();
      const fileName = prompt('保存するファイル名を入力 (.js 推奨):');
      if (!fileName) return alert('ファイル名必須!');
      const blob = new Blob([code], {type:'text/plain'});
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = (/\.(js|json)$/i).test(fileName)? fileName:fileName+'.js';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });

    document.getElementById('loadBtn').addEventListener('click', async function () {
      const maybeURL = prompt('GitHub のファイルURL（空欄でローカル選択）:');
      if(maybeURL && maybeURL.trim()) {
        const rawURL = maybeURL.replace('github.com','raw.githubusercontent.com').replace('/blob/','/');
        try {
          const resp = await fetch(rawURL,{cache:'no-cache'});
          if(!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`);
          rightEditor.setValue(await resp.text());
          alert('GitHub から読み込み成功');
        } catch(e) { alert('読み込みエラー: '+e.message); }
        return;
      }
      // ローカルファイル
      const input = document.createElement('input');
      input.type='file'; input.accept='.js,.json,.txt';
      input.onchange = e => {
        const f = e.target.files[0];
        if(f){ const r = new FileReader(); r.onload=()=>rightEditor.setValue(r.result); r.readAsText(f); }
      };
      input.click();
    });

    document.getElementById('clearBtn').addEventListener('click', function () {
      if(confirm('リセットしますか?')) { rightEditor.setValue(''); localStorage.removeItem('userCode'); errorDisplay.textContent=''; }
    });

    document.getElementById('checkBtn').addEventListener('click', checkScriptAPI);
  });
});
