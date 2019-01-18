var _ = require('underscore');

module.exports = function (CodeMirror) {
  var Pos = CodeMirror.Pos;

  function arrayContains (arr, item) {
    return arr.indexOf(item) !== -1;
  }

  function scriptHint (editor, keywords, getToken, options) {
    // Find the token at the cursor
    var cur = editor.getCursor();
    var token = getToken(editor, cur);
    var tprop = token;
    var context = [];
    token.state = CodeMirror.innerMode(editor.getMode(), token.state).state;

    // If it's not a 'word-style' token, ignore the token.
    if (!/^[\w$_-]*$/.test(token.string)) {
      token = tprop = {
        start: cur.ch,
        end: cur.ch,
        string: '',
        state: token.state,
        type: token.string === '.' ? 'property' : null
      };
    }
    // If it is a property, find out what it is a property of.
    while (tprop.type === 'property') {
      tprop = getToken(editor, Pos(cur.line, tprop.start));
      if (tprop.string !== '.') return;
      tprop = getToken(editor, Pos(cur.line, tprop.start));
      if (tprop.string === ')') {
        var level = 1;
        do {
          tprop = getToken(editor, Pos(cur.line, tprop.start));
          switch (tprop.string) {
            case ')':
              level++;
              break;
            case '(':
              level--;
              break;
            default:
              break;
          }
        } while (level > 0);
        tprop = getToken(editor, Pos(cur.line, tprop.start));
        if (tprop.type.indexOf('variable') === 0) tprop.type = 'function';
        else return; // no clue
      }
      context.push(tprop);
    }

    return {
      list: getCompletions(token, context, keywords, options),
      from: Pos(cur.line, token.start),
      to: Pos(cur.line, token.end)
    };
  }

  function columnsHint (editor, options) {
    return scriptHint(editor, [], /* javascriptKeywords */
      function (e, cur) {
        return e.getTokenAt(cur);
      },
      options);
  }

  CodeMirror.registerHelper('hint', 'custom-list', columnsHint);

  function getCompletions (token, context, keywords, options) {
    var found = [];
    var start = token.string.toLowerCase();

    function maybeAdd (str) {
      var hit = _.isObject(str) ? str.text : str;
      hit = hit.toLowerCase();
      if (hit.indexOf(start) === 0 && start !== hit && !arrayContains(found, hit)) {
        found.push(str);
      }
    }

    function gatherCompletions (obj) {
      for (var name in obj) {
        maybeAdd(obj[name]);
      }
    }

    gatherCompletions(options.list);
    _.each(keywords, maybeAdd);

    return found;
  }
};
