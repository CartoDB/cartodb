var cdb = require('cartodb.js');
var ViewFactory = require('../../../../javascripts/cartodb3/components/view-factory');

describe('components/view-factory', function () {
  describe('.createByHTML', function () {
    beforeEach(function () {
      this.html = '<div>foo bar!</div>';

      this.view = ViewFactory.createByHTML(this.html);
      spyOn(this.view.$el, 'html');
      this.view.render();
    });

    it('should not have leaks', function () {
      expect(this.view).toHaveNoLeaks();
    });

    it("should inject the rendered results into the view's element", function () {
      expect(this.view.$el.html).toHaveBeenCalled();
      expect(this.view.$el.html).toHaveBeenCalledWith('<div>foo bar!</div>');
    });
  });

  describe('.createByTemplate', function () {
    beforeEach(function () {
      this.template = jasmine.createSpy('compiled template');
      this.template.and.returnValue('<div>foo bar!</div>');
      this.templateData = { foo: 'bar' };

      this.view = ViewFactory.createByTemplate(this.template, this.templateData);
      spyOn(this.view.$el, 'html');
      this.view.render();
    });

    it('should not have leaks', function () {
      expect(this.view).toHaveNoLeaks();
    });

    it('should render given template with template data', function () {
      expect(this.template).toHaveBeenCalled();
      expect(this.template).toHaveBeenCalledWith(this.templateData);
    });

    it("should inject the rendered results into the view's element", function () {
      expect(this.view.$el.html).toHaveBeenCalled();
      expect(this.view.$el.html).toHaveBeenCalledWith('<div>foo bar!</div>');
    });
  });

  describe('.createByList', function () {
    beforeEach(function () {
      var createItemView = function (id) {
        var view = new cdb.core.View({
          tagName: 'li'
        });
        view.render = function () {
          this.$el.html('<div id="' + id + '">');
          return this;
        };
        return view;
      };
      this.view = ViewFactory.createByList([
        createItemView('item #1'),
        createItemView('item #2'),
        createItemView('item #3')
      ], {
        tagName: 'ul'
      });
      this.view.render();
    });

    it('should not have leaks', function () {
      expect(this.view).toHaveNoLeaks();
    });

    it('should pass the view opts when creating view', function () {
      expect(this.view.$el.prop('tagName').toLowerCase()).toEqual('ul');
    });

    it('should render the items', function () {
      expect(this.innerHTML()).toContain('item #1');
      expect(this.innerHTML()).toContain('item #2');
      expect(this.innerHTML()).toContain('item #3');
    });
  });
});
