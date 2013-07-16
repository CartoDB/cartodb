describe('Utils', function() {

  // Strip html function
  describe('stripHTML', function() {

    it("should strip a text with tags except <a>", function() {
      var value = '<p>jamon</p> <a>jamon</a>';
      var allowed = '<a>';
      expect(cdb.Utils.stripHTML(value, allowed)).toBe('jamon <a>jamon</a>')
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

  });


});