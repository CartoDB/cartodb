var sanitize = require('../../../src/core/sanitize');

describe("core/sanitize", function() {

  describe('.html', function() {
    describe('when given a HTML', function() {
      it('should allow safe HTML', function() {
        expect(sanitize.html('test')).toEqual('test');
        expect(sanitize.html('<div>works</div>')).toEqual('<div>works</div>');
      });

      it('should remove unsafe stuff', function() {
        expect(sanitize.html('<img src="fail.png" onerror="document.body.appendChild(document.createElement(\'script\')).src=\'http://localhost/xss.js\'" /> nono')).toEqual('<img src="fail.png"> nono');
        expect(sanitize.html('nono <scrip src="ext.js"></script>')).toEqual('nono ');
      });

      it('should allow target attributes for links', function() {
        expect(sanitize.html('<a href="https://carto.com/" target="_blank">carto.com</a>')).toEqual('<a href="https://carto.com/" target="_blank">carto.com</a>');
      });
      it('should remove iframe tag', function() {
        expect(sanitize.html('no <iframe src="" onload="document.body.appendChild(document.createElement(\'script\')).src=\'http://localhost/xss.js\'"/> no')).toEqual('no ');
      });
    });

    describe('when given an 2nd param with a function', function() {
      beforeEach(function() {
        this.optionalSanitizer = jasmine.createSpy('optionalSanitizer').and.returnValue('optional sanitizer result');
      });

      it('should use that to sanitize instead', function() {
        expect(sanitize.html('<p>something</p>', this.optionalSanitizer)).toEqual('optional sanitizer result');
        expect(this.optionalSanitizer).toHaveBeenCalled();
        expect(this.optionalSanitizer).toHaveBeenCalledWith('<p>something</p>');
      });
    });

    describe('when given a 2nd param with a non-undefined/function value', function() {
      it('should skip sanitize', function() {
        expect(sanitize.html('<script src="i-know-what-im-doing.js"></script>', false)).toEqual('<script src="i-know-what-im-doing.js"></script>');
        expect(sanitize.html('<script src="i-know-what-im-doing.js"></script>', null)).toEqual('<script src="i-know-what-im-doing.js"></script>');
      });
    });

    describe('common XSS attacks', function() {

      var attacks = [
        '<iframe><iframe src="/>"><p <a><img/src="x"/onerror="prompt(document.cookie)">',
        "<iframe srcdoc='&lt;svg/onload=alert(document.cookie)&gt;’>"
      ];

      it('should avoid `' + attacks[0] + '`', function() {
        expect(sanitize.html(attacks[0])).toEqual('');
      });

      it('should avoid `' + attacks[1] + '`', function() {
        expect(sanitize.html(attacks[1])).toEqual('');
      });

    });
  });
});
