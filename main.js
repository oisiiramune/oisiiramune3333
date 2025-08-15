import * as monaco from 'https://cdn.jsdelivr.net/npm/monaco-editor@0.43.0/+esm';

const sampleCode = `// サンプル JavaScript
function greet(name) {
  console.log("Hello, " + name);
}
greet("World");`;

// 左側エディタ（サンプル表示）
const leftEditor = monaco.editor.create(document.getElementById('left'), {
  value: sampleCode,
  language: 'javascript',
  theme: 'vs-dark',
  readOnly: true,
  automaticLayout: true,
  lineNumbers: 'on'
});

// 右側エディタ（編集用）
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

// 保存
document.getElementById('saveBtn').addEventListener('click', () => {
  const code = rightEditor.getValue();
  const fileName = prompt("保存するファイル名を入力してください:");
  if(!fileName) { alert("ファイル名は必須です！"); return; }
  const blob = new Blob([code], {type:'text/plain'});
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName.endsWith('.js') ? fileName : fileName+'.js';
  link.click();
});

// 読み込み
document.getElementById('loadBtn').addEventListener('click', () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.js,.json';
  input.onchange = e => {
    const file = e.target.files[0];
    if(file) {
      const reader = new FileReader();
      reader.onload = () => rightEditor.setValue(reader.result);
      reader.readAsText(file);
    }
  };
  input.click();
});

// リセット
document.getElementById('clearBtn').addEventListener('click', () => {
  if(confirm("本当にリセットしますか？")) {
    rightEditor.setValue('');
    localStorage.removeItem('userCode');
  }
});

// ScriptAPIチェック（仮）
document.getElementById('checkBtn').addEventListener('click', () => {
  const code = rightEditor.getValue();
  try {
    new Function(code);
    alert("ScriptAPI構文チェック: エラーなし（簡易）");
  } catch(e) {
    alert("ScriptAPI構文チェック: エラーあり\n"+e.message);
  }
});
