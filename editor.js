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
    lineNumbers: 'on',
  });

  const rightEditor = monaco.editor.create(document.getElementById('right'), {
    value: localStorage.getItem('userCode') || '',
    language: 'javascript',
    theme: 'vs-dark',
    automaticLayout: true,
    lineNumbers: 'on',
    autoClosingBrackets: 'always',
    autoClosingQuotes: 'always',
    suggestOnTriggerCharacters: true,
  });

  const errorDisplay = document.getElementById('errorDisplay');

  function checkSyntax() {
    const code = rightEditor.getValue();
    try { new Function(code); errorDisplay.textContent = ''; }
    catch(e) { errorDisplay.textContent = `構文エラー: ${e.message}`; }
  }

  rightEditor.onDidChangeModelContent(() => {
    checkSyntax();
    localStorage.setItem('userCode', rightEditor.getValue());
  });

  // 保存
  window.saveCode = function() {
    const code = rightEditor.getValue();
    const fileName = prompt("保存するファイル名を入力してください:");
    if(!fileName){ alert("ファイル名は必須です！"); return; }
    const blob = new Blob([code], {type:'text/plain'});
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName.endsWith('.js')?fileName:fileName+'.js';
    link.click();
  }

  // GitHub読み込み
  window.loadCodeFromGitHub = async function() {
    const repo = prompt("GitHubリポジトリURLを入力:");
    const path = prompt("ファイルパスを入力（例: test.js）:");
    if(!repo || !path) return alert("URLとファイルパスは必須です");
    try {
      let rawURL = repo.replace(/\/$/, '') + '/raw/main/' + path;
      const resp = await fetch(rawURL);
      if(!resp.ok) throw new Error(resp.status + " " + resp.statusText);
      const text = await resp.text();
      rightEditor.setValue(text);
      alert("読み込み成功");
    } catch(e) {
      alert("GitHub読み込みエラー: "+e.message);
    }
  }

  // リセット
  window.clearEditor = function() {
    if(confirm("本当にリセットしますか？")){
      rightEditor.setValue('');
      localStorage.removeItem('userCode');
    }
  }

  // ScriptAPIチェック
  window.toggleScriptAPI = function() {
    const code = rightEditor.getValue();
    try {
      new Function(code); // 構文チェック
      try { eval(code); } // 未定義・非対応のチェック
      catch(e){ alert("ScriptAPIチェック: エラーあり\n" + e.message); return; }
      alert("ScriptAPIチェック: エラーなし");
    } catch(e){
      alert("構文エラー: " + e.message);
    }
  }

  // コーデとしての最後
  if(typeof completion==='function'){ completion(result); }

});
