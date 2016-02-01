var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
var ViewFactory = require('../../../../javascripts/cartodb/common/view_factory');

describe('common/view_factory', function() {
  describe('.createByTemplate', function() {
    beforeEach(function() {
      this.template = jasmine.createSpy('compiled template');
      this.template.and.returnValue('<div>foo bar!</div>');
      this.templateData = { foo: 'bar'};

      this.view = ViewFactory.createByTemplate(this.template, this.templateData);
      spyOn(this.view.$el, 'html');
      this.view.render();
    });

    it('should not have leaks', function() {
      expect(this.view).toHaveNoLeaks();
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

  describe('.createDialogByTemplate', function() {
    beforeEach(function() {
      this.template = jasmine.createSpy('compiled template');
      this.template.and.returnValue('<div>foo bar!</div>');
      this.templateData = { foo: 'bar'};

      this.view = ViewFactory.createDialogByTemplate(this.template, this.templateData, { sticky: true });
      spyOn(this.view.$el, 'html');
      this.view.render();
    });

    it('should not have leaks', function() {
      expect(this.view).toHaveNoLeaks();
    });

    it('should send the dialog options to the view', function() {
      expect(this.view.options.sticky).toBeTruthy();
    });

  });

  describe('.createDialogByView', function() {
    beforeEach(function() {
      this.contentView = new cdb.core.View();
      this.view = ViewFactory.createDialogByView(this.contentView);
      this.contentView.render = function() {
        this.$el.html('<em>was rendered</em>');
        return this;
      };
      spyOn(this.contentView, 'render').and.callThrough();
      spyOn(this.view, 'render_content').and.callThrough();
      this.view.render();
    });

    it('should not have leaks', function() {
      expect(this.view).toHaveNoLeaks();
    });

    it('should return a dialog view that renders the content view inside it', function() {
      expect(this.view.appendToBody).toEqual(jasmine.any(Function));
      expect(this.contentView.render).toHaveBeenCalled();
      expect(this.view.render_content).toHaveBeenCalled();
      expect(this.innerHTML()).toContain('was rendered');
    });

    it('should cleans view upon hiding by default', function() {
      spyOn(this.view, 'clean');
      expect(this.view.clean).not.toHaveBeenCalled();
      this.view.hide();
      expect(this.view.clean).toHaveBeenCalled();
    });
  });

  describe('.createByList', function() {
    beforeEach(function() {
      createItemView = function(id) {
        var view = new cdb.core.View({
          tagName: 'li'
        });
        view.render = function() {
          this.$el.html(this.make('div', {}, id));
          return this;
        };
        return view;
      }
      this.view = ViewFactory.createByList([
        createItemView('item #1'),
        createItemView('item #2'),
        createItemView('item #3')
      ], {
        tagName: 'ul'
      });
      this.view.render();
    });

    it('should not have leaks', function() {
      expect(this.view).toHaveNoLeaks();
    });

    it('should pass the view opts when creating view', function() {
      expect(this.view.$el.prop('tagName').toLowerCase()).toEqual('ul');
    });

    it('should render the items', function() {
      expect(this.innerHTML()).toContain('item #1');
      expect(this.innerHTML()).toContain('item #2');
      expect(this.innerHTML()).toContain('item #3');
    });
  });
});
