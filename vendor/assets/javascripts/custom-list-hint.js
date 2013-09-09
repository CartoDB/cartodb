(function() {
  "use strict";

  CodeMirror.registerHelper("hint", "custom-list", function(editor, options) {
    var cur = editor.getCursor(), curLine = editor.getLine(cur.line);
    var start = cur.ch, end = start;
    return {list: ["jamon", "paco", "ey macavei"], from: CodeMirror.Pos(cur.line, start), to: CodeMirror.Pos(cur.line, end)};
  });
})();