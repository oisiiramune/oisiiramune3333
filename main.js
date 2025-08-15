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

    // --- 常時チェック ---
    rightEditor.onDidChangeModelContent(() => {
      checkSyntax();
      localStorage.setItem('userCode', rightEditor.getValue());
    });

    // --- 保存 ---
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

    // --- 読み込み（ファイル単体 or 複数） ---
    async function loadHandler() {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;           // 複数ファイル対応
      input.accept = '.js,.json,.txt'; // iOSでも有効

      input.onchange = e => {
        const files = Array.from(e.target.files);
        files.forEach(f => {
          const reader = new FileReader();
          reader.onload = () => {
            const prev = rightEditor.getValue();
            rightEditor.setValue(prev + '\n// ' + f.name + '\n' + reader.result);
          };
          reader.readAsText(f);
        });
      };

      input.click();
    }

    // --- リセット ---
    function clearHandler() {
      if (confirm('本当にリセットしますか？')) {
        rightEditor.setValue('');
        localStorage.removeItem('userCode');
        errorDisplay.textContent = '';
      }
    }

    // --- ボタンイベント ---
    document.getElementById('saveBtn').addEventListener('click', saveHandler);
    document.getElementById('loadBtn').addEventListener('click', loadHandler);
    document.getElementById('clearBtn').addEventListener('click', clearHandler);

    // 初回チェック
    checkSyntax();

    // --- コードとしての最後 ---
    if (typeof completion === 'function') completion(result);
  });
});
