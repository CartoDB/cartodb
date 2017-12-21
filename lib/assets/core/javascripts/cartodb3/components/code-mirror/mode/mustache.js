module.exports = function (CodeMirror) {
  CodeMirror.defineMode('mustache', function () {
    return {
      token: function (stream, state) {
        var ch;

        if (stream.match('{{')) {
          ch = stream.peek();
          if (ch == null || ch != null && ch.match(/[{]{1,}/)) {
            stream.next();
            return 'mustache-error';
          } else if (ch != null && ch.match(/[a-zA-Z\u00C0-\u024F_]+/)) {
            return null;
          }
        }

        if (stream.match('}}')) {
          ch = stream.peek();
          if (ch != null && ch.match(/[}]{1,}/)) {
            stream.next();
            return 'mustache-error';
          } else if (ch == null) {
            return null;
          }
        }

        if (stream.match('}')) {
          ch = stream.peek();
          if (ch == null || ch != null && ch.match(/[}]{1,}/)) {
            stream.next();
            return 'mustache-error';
          }
        }

        if (stream.match('{')) {
          ch = stream.peek();
          if (ch == null || ch != null && ch.match(/[{]{1,}/)) {
            stream.next();
            return 'mustache-error';
          }
        }

        // Delimiter character
        if (stream.match(/[a-zA-Z\u00C0-\u024F_]+/, true)) {
          return 'mustache-text';
        }

        // jump to the next item, needed OR CRASH
        stream.next();
      }
    };
  });

  (function () {
    var sqlKeywords = '{{  }}';

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
