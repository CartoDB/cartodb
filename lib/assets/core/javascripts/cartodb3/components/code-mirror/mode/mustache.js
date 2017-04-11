module.exports = function (CodeMirror) {
  CodeMirror.defineMode('mustache', function () {
    return {
      token: function (stream, state) {
        var ch;
        if (stream.match('{{')) {
          while ((ch = stream.next()) != null) {
            if (ch === '}' && stream.next() === '}') {
              stream.eat('}');
              return 'mustache-text';
            }
          }
        }
        while (stream.next() !== null && !stream.match('{{', false)) {}
        return null;
      }
    };
  });

  (function () {
    var sqlKeywords = '{{ }}';

    function set (str) {
      var obj = {};
      var words = str.split(' ');
      for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
      return obj;
    }

    CodeMirror.defineMIME('text/mustache', {
      name: 'mustache',
      client: set('source'),
      keywords: set(sqlKeywords)
    });
  }());
};
