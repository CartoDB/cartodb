describe("core.core.sanitize", function() {

  describe('.html', function() {

    describe('when given a HTML', function() {

      it('should allow safe HTML', function() {
        expect(cdb.core.sanitize.html('test')).toEqual('test');
        expect(cdb.core.sanitize.html('<div>works</div>')).toEqual('<div>works</div>');
      });

      it('should remove unsafe stuff', function() {
        expect(cdb.core.sanitize.html('<img src="fail.png" onerror="document.body.appendChild(document.createElement(\'script\')).src=\'http://localhost/xss.js\'" /> nono')).toEqual('<img src="fail.png"> nono');
        expect(cdb.core.sanitize.html('nono <scrip src="ext.js"></script>')).toEqual('nono ');
      });

      it('should allow target attributes for links', function() {
        expect(cdb.core.sanitize.html('<a href="https://carto.com/" target="_blank">carto.com</a>')).toEqual('<a href="https://carto.com/" target="_blank">carto.com</a>');
      });

      it('should remove iframe tag', function() {
        expect(cdb.core.sanitize.html('no <iframe src="" onload="document.body.appendChild(document.createElement(\'script\')).src=\'http://localhost/xss.js\'"/> no')).toEqual('no ');
      });
    });

    describe('when given an 2nd param with a function', function() {
      beforeEach(function() {
        this.optionalSanitizer = jasmine.createSpy('optionalSanitizer').and.returnValue('optional sanitizer result');
      });

      it('should use that to sanitize instead', function() {
        expect(cdb.core.sanitize.html('<p>something</p>', this.optionalSanitizer)).toEqual('optional sanitizer result');
        expect(this.optionalSanitizer).toHaveBeenCalled();
        expect(this.optionalSanitizer).toHaveBeenCalledWith('<p>something</p>');
      });
    });

    describe('when given a 2nd param with a non-undefined/function value', function() {
      it('should skip sanitize', function() {
        expect(cdb.core.sanitize.html('<script src="i-know-what-im-doing.js"></script>', false)).toEqual('<script src="i-know-what-im-doing.js"></script>');
        expect(cdb.core.sanitize.html('<script src="i-know-what-im-doing.js"></script>', null)).toEqual('<script src="i-know-what-im-doing.js"></script>');
      });
    });

    describe('common XSS attacks', function() {

      var attacks = [
        '<iframe><iframe src="/>"><p <a><img/src="x"/onerror="prompt(document.cookie)">',
        "<iframe srcdoc='&lt;svg/onload=alert(document.cookie)&gt;'>",
        "<img src=x onerror=alert(/XSS/)>",
        "<iframe src=j&NewLine;&Tab;a&NewLine;&Tab;&Tab;v&NewLine;&Tab;&Tab;&Tab;a&NewLine;&Tab;&Tab;&Tab;&Tab;s&NewLine;&Tab;&Tab;&Tab;&Tab;&Tab;c&NewLine;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;r&NewLine;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;i&NewLine;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;p&NewLine;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;t&NewLine;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&colon;a&NewLine;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;l&NewLine;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;e&NewLine;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;r&NewLine;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;t&NewLine;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;%28&NewLine;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;1&NewLine;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;&Tab;%29></iframe>",
        '"><img src="C" onerror=alert(1)>',
        '"><img src="C" onerror=alert(document.cookie)>'
      ];

      it('should avoid `' + attacks[0] + '`', function() {
        expect(cdb.core.sanitize.html(attacks[0])).toEqual('');
      });

      it('should avoid `' + attacks[1] + '`', function() {
        expect(cdb.core.sanitize.html(attacks[1])).toEqual('');
      });

      it('should avoid `' + attacks[2] + '`', function() {
        expect(cdb.core.sanitize.html(attacks[2])).toEqual('<img src="x">');
      });

      it('should avoid `' + attacks[3] + '`', function() {
        expect(cdb.core.sanitize.html(attacks[3])).toEqual('');
      });

      it('should avoid `' + attacks[4] + '`', function() {
        expect(cdb.core.sanitize.html(attacks[4])).toEqual('"&gt;<img src="C">');
      });

      it('should avoid `' + attacks[5] + '`', function() {
        expect(cdb.core.sanitize.html(attacks[5])).toEqual('"&gt;<img src="C">');
      });

    });

  });

});
