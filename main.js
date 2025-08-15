window.addEventListener('DOMContentLoaded', () => {
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

    // --- 構文チェック関数 ---
    function checkSyntax() {
      const code = rightEditor.getValue();
      try {
        new Function(code);
        errorDisplay.textContent = '';
      } catch(e) {
        errorDisplay.textContent = `構文エラー: ${e.message}`;
      }
    }

    // --- 常時構文チェック ---
    rightEditor.onDidChangeModelContent(() => {
      checkSyntax();
      localStorage.setItem('userCode', rightEditor.getValue());
    });

    // --- ボタン ---
    function saveHandler() {
      const code = rightEditor.getValue();
      const fileName = prompt('保存するファイル名を入力してください:');
      if (!fileName) return alert('ファイル名は必須です！');
      const blob = new Blob([code], { type: 'text/plain' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName.endsWith('.js') ? fileName : fileName+'.js';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        URL.revokeObjectURL(link.href);
        document.body.removeChild(link);
      }, 0);
    }

    async function loadHandler() {
      const input = document.createElement('input');
      input.type = 'file';
      input.webkitdirectory = true; // フォルダ選択対応
      input.multiple = true;
      input.accept = '.js,.json,.txt';
      input.onchange = e => {
        const files = Array.from(e.target.files);
        let combined = rightEditor.getValue();
        files.forEach(f => {
          const reader = new FileReader();
          reader.onload = () => {
            combined += '\n// ' + f.name + '\n' + reader.result;
            rightEditor.setValue(combined);
          };
          reader.readAsText(f);
        });
      };
      input.click();
    }

    function clearHandler() {
      if (confirm('本当にリセットしますか？')) {
        rightEditor.setValue('');
        localStorage.removeItem('userCode');
        errorDisplay.textContent = '';
      }
    }

    // --- イベント ---
    document.getElementById('saveBtn').addEventListener('click', saveHandler);
    document.getElementById('loadBtn').addEventListener('click', loadHandler);
    document.getElementById('clearBtn').addEventListener('click', clearHandler);

    // 初回チェック
    checkSyntax();

    // --- コードとしての最後 ---
    if (typeof completion === 'function') completion(result);

  });
});
