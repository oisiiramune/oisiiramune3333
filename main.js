require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.41.0/min/vs' }});
require(['vs/editor/editor.main'], function () {

  const sampleCode = `// サンプル JavaScript
function greet(name) {
  console.log("Hello, " + name);
}
greet("World");

// JSONサンプル
{
  "name": "John",
  "age": 30,
  "city": "Tokyo"
}`;

  // 左側：サンプルコード（読み取り専用）
  const leftEditor = monaco.editor.create(document.getElementById('left'), {
    value: sampleCode,
    language: 'javascript',
    theme: 'vs-dark',
    readOnly: true,
    automaticLayout: true,
    lineNumbers: 'on'
  });

  // 右側：ユーザー編集エリア
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

  // 構文チェック
  function checkSyntax() {
    const code = rightEditor.getValue();
    try {
      new Function(code);
      errorDisplay.textContent = '';
    } catch (e) {
      errorDisplay.textContent = `構文エラー: ${e.message}`;
    }
  }

  rightEditor.onDidChangeModelContent(() => {
    checkSyntax();
    localStorage.setItem('userCode', rightEditor.getValue());
  });

  // グローバル公開してonclickから呼べるようにする
  window.saveCode = function () {
    const code = rightEditor.getValue();
    const fileName = prompt("保存するファイル名を入力してください:");
    if (!fileName) {
      alert("ファイル名は必須です！");
      return;
    }
    const blob = new Blob([code], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName.endsWith('.js') || fileName.endsWith('.json') ? fileName : fileName + '.js';
    link.click();
  };

  window.loadCode = function () {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.js,.json';
    input.onchange = e => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          rightEditor.setValue(reader.result);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  window.clearEditor = function () {
    if (confirm("本当にリセットしますか？")) {
      rightEditor.setValue('');
      localStorage.removeItem('userCode');
    }
  };

  window.toggleScriptAPI = function () {
    const code = rightEditor.getValue();
    const unsupported = [];
    const unsupportedModules = ["@minecraft/server", "@minecraft/server-ui", "@minecraft/common"];
    unsupportedModules.forEach(mod => {
      if (code.includes(mod)) {
        unsupported.push(`非対応モジュール: ${mod}`);
      }
    });
    try {
      new Function(code);
    } catch (e) {
      unsupported.push(`構文エラー: ${e.message}`);
    }
    if (unsupported.length) {
      alert("ScriptAPIチェック結果:\n" + unsupported.join("\n"));
    } else {
      alert("ScriptAPIチェック: エラーなし（簡易チェック）");
    }
  };

});
