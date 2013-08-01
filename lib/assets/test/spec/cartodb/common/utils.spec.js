describe('Utils', function() {

  // Strip html function
  describe('stripHTML', function() {

    it("should strip a text with tags except <a>", function() {
      var value = '<p>jamon</p> <a>jamon</a>';
      var allowed = '<a>';
      expect(cdb.Utils.stripHTML(value, allowed)).toBe('jamon <a>jamon</a>')
    });

    it("shouldn't strip anything if the input is an object", function() {
      var value = [];
      var allowed = '<a>';
      expect(cdb.Utils.stripHTML(value, allowed)).toBe('')

      var value = {};
      expect(cdb.Utils.stripHTML(value, allowed)).toBe('')
    });

    it("shouldn't strip anything if the input is undefined", function() {
      var value = undefined;
      var allowed = '<a>';
      expect(cdb.Utils.stripHTML(value, allowed)).toBe('')
    });

    it("should strip a text with tags", function() {
      var value = '<p>jamon</p> <a>jamon</a>';
      var allowed = '';
      expect(cdb.Utils.stripHTML(value, allowed)).toBe('jamon jamon')
    });

  });

  // Remove events attached to html code
  describe('removeHTMLEvents', function() {

    it("should remove onClick function from a <a> tag", function() {
      var value = '<a onClick="alert(\'paco\')">jamon</a>';
      expect(cdb.Utils.removeHTMLEvents(value)).toBe('<a>jamon</a>')
    });

    it("shouldn't remove anything if there is no events attached", function() {
      var value = '<a>jamon</a>';
      expect(cdb.Utils.removeHTMLEvents(value)).toBe('<a>jamon</a>')
    });

    it("shouldn't remove anything if the input is undefined", function() {
      var value = undefined;
      expect(cdb.Utils.removeHTMLEvents(value)).toBe('')
    });

  });


  // Remove events attached to html code
  describe('isURL', function() {

    it("should check if the string is an url or an ftp", function() {
      expect(cdb.Utils.isURL('ftp://jamon.com')).toBeTruthy();
    });

    it("shouldn't check if the string is undefined or null or empty", function() {
      expect(cdb.Utils.isURL('')).toBeFalsy()
      expect(cdb.Utils.isURL()).toBeFalsy()
      expect(cdb.Utils.isURL(undefined)).toBeFalsy()
    });

    it("should be false if the string is a name, for example", function() {
      expect(cdb.Utils.isURL("eyeyyeeyyeey")).toBeFalsy();
    });

  });

});
