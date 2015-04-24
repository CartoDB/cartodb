var cdb = require('cartodb.js');
var ViewFactory = require('../../../../javascripts/cartodb/new_common/view_factory');

describe('new_common/view_factory', function() {
  describe('.createByTemplate', function() {
    beforeEach(function() {
      this.template = jasmine.createSpy('compiled template');
      this.template.and.returnValue('<div>foo bar!</div>');
      this.templateData = { foo: 'bar'};

      this.view = ViewFactory.createByTemplate(this.template, this.templateData);
      spyOn(this.view.$el, 'html');
      this.view.render();
    });

    it('should render given template with template data', function() {
      expect(this.template).toHaveBeenCalled();
      expect(this.template).toHaveBeenCalledWith(this.templateData);
    });

    it("should inject the rendered results into the view's element", function() {
      expect(this.view.$el.html).toHaveBeenCalled();
      expect(this.view.$el.html).toHaveBeenCalledWith('<div>foo bar!</div>');
    });
  });
});
