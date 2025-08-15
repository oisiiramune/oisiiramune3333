window.addEventListener('DOMContentLoaded', function () {

  if (typeof require === 'undefined') {
    console.error('Monaco loader.js が読み込まれていません。');
    return;
  }

  require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.41.0/min/vs' }});
  require(['vs/editor/editor.main'], function() {

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
        errorDisplay.textContent = '';
      } catch(e) {
        errorDisplay.textContent = `構文エラー: ${e.message}`;
      }
    }

    rightEditor.onDidChangeModelContent(() => {
      checkSyntax();
      localStorage.setItem('userCode', rightEditor.getValue());
    });

    // --- ボタン処理 ---
    document.getElementById('saveBtn').addEventListener('click', function() {
      const code = rightEditor.getValue();
      const fileName = prompt('保存するファイル名を入力してください（.js 推奨）:');
      if (!fileName) { alert('ファイル名は必須です！'); return; }
      const blob = new Blob([code], {type:'text/plain'});
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = (/\.(js|json)$/i).test(fileName) ? fileName : fileName+'.js';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => { URL.revokeObjectURL(link.href); document.body.removeChild(link); }, 0);
    });

    document.getElementById('loadBtn').addEventListener('click', async function() {
      const maybeURL = prompt('GitHub のファイルURL（空欄ならローカルファイル）:');
      if (maybeURL && maybeURL.trim()) {
        const rawURL = maybeURL.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
        try {
          const resp = await fetch(rawURL, {cache:'no-cache'});
          if (!resp.ok) throw new Error(resp.statusText);
          rightEditor.setValue(await resp.text());
          alert('GitHub から読み込みました');
        } catch(e) { alert('読み込みエラー: '+e.message); }
        return;
      }

      const input = document.createElement('input');
      input.type='file'; input.accept='.js,.json,.txt';
      input.onchange = e => { const file = e.target.files[0]; if(file){ const reader = new FileReader(); reader.onload=()=>rightEditor.setValue(reader.result); reader.readAsText(file); } };
      input.click();
    });

    document.getElementById('clearBtn').addEventListener('click', function() {
      if(confirm('本当にリセットしますか？')) { rightEditor.setValue(''); localStorage.removeItem('userCode'); errorDisplay.textContent=''; }
    });

    document.getElementById('checkBtn').addEventListener('click', function() {
      const code = rightEditor.getValue();
      const findings = [];
      try { new Function(code); } catch(e){ findings.push('構文エラー: '+e.message); }

      const bannedModules = ['@minecraft/server','@minecraft/server-ui','@minecraft/common'];
      bannedModules.forEach(mod => { if(code.includes(mod)) findings.push('非対応モジュール: '+mod); });

      if(/require\s*\(/.test(code) || /\bimport\s+.+from\s+['"][^'"]+['"]/.test(code)) findings.push('注意: import/require 含む');

      if(findings.length) alert('ScriptAPIチェック結果:\n'+findings.join('\n'));
      else alert('ScriptAPIチェック: エラーなし');
    });

    checkSyntax();

    // --- コードとしての最後に ---
    try { if(typeof completion==='function'){ completion(result); } } catch(_) {}
  });
});
