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
        expect(cdb.core.sanitize.html('<a href="http://cartodb.com/" target="_blank">cartodb.com</a>')).toEqual('<a href="http://cartodb.com/" target="_blank">cartodb.com</a>');
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
  });
});
