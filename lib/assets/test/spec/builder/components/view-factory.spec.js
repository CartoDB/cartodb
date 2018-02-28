var CoreView = require('backbone/core-view');
var ViewFactory = require('builder/components/view-factory');

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

  describe('.createListView', function () {
    describe('when given proper input', function () {
      beforeEach(function () {
        var createItemView = function (id) {
          var view = new CoreView({tagName: 'li'});
          view.render = function () {
            this.$el.html('<div id="' + id + '"></div>');
            return this;
          };
          return view;
        };

        var createViewFns = [
          createItemView.bind(this, 'header'),
          createItemView.bind(this, 'items'),
          createItemView.bind(this, 'footer')
        ];

        var viewOpts = {tagName: 'ul'};
        this.view = ViewFactory.createListView(createViewFns, viewOpts);
        this.view.render();
      });

      it('should not have leaks', function () {
        expect(this.view).toHaveNoLeaks();
      });

      it('should pass the view opts when creating view', function () {
        expect(this.view.$el.prop('tagName').toLowerCase()).toEqual('ul');
      });

      it('should render the items', function () {
        expect(this.innerHTML()).toContain('id="header"');
        expect(this.innerHTML()).toContain('id="items"');
        expect(this.innerHTML()).toContain('id="footer"');
      });
    });

    describe('when given bad input', function () {
      it('should throw a descriptive error', function () {
        expect(function () { ViewFactory.createListView(); }).toThrowError(/required/);
        expect(function () { ViewFactory.createListView(['meh']); }).toThrowError(/must only contain functions/);
        expect(function () { ViewFactory.createListView([ function () {}, 'meh' ]); }).toThrowError(/must only contain functions/);
      });
    });
  });
});
