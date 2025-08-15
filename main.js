window.saveCode = function() {
  const code = rightEditor.getValue();
  const fileName = prompt("保存するファイル名を入力してください:");
  if(!fileName) { alert("ファイル名は必須です！"); return; }
  const blob = new Blob([code], {type:'text/plain'});
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName.endsWith('.js') || fileName.endsWith('.json') ? fileName : fileName+'.js';
  link.click();
};

window.loadCode = function() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.js,.json';
  input.onchange = e => {
    const file = e.target.files[0];
    if(file) {
      const reader = new FileReader();
      reader.onload = () => {
        rightEditor.setValue(reader.result);
      };
      reader.readAsText(file);
    }
  };
  input.click();
};

window.clearEditor = function() {
  if(confirm("本当にリセットしますか？")) {
    rightEditor.setValue('');
    localStorage.removeItem('userCode');
  }
};

window.toggleScriptAPI = function() {
  const code = rightEditor.getValue();
  try {
    new Function(code);
    alert("ScriptAPI構文チェック: エラーなし（簡易チェック）");
  } catch(e) {
    alert("ScriptAPI構文チェック: エラーあり\n"+e.message);
  }
};
