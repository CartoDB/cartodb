var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var ModalViewModel = require('builder/components/modals/modal-view-model');
var ModalView = require('builder/components/modals/modal-view');

describe('components/modals/modal-view', function () {
  var view, model, contentView, contentViewModel, contentViewEventSpy;

  var createViewFn = function (options) {
    contentViewEventSpy = jasmine.createSpy('test');

    model = new ModalViewModel({
      createContentView: function () { return contentView; }
    });

    var TestView = CoreView.extend({
      initialize: function () {
        this.model.on('test', contentViewEventSpy, this);
      }
    });

    contentViewModel = new Backbone.Model();
    contentView = new TestView({model: contentViewModel});
    spyOn(contentView, 'render').and.callThrough();

    var defaultOptions = {
      model: model
    };

    view = new ModalView(_.extend(defaultOptions, options));

    return view;
  };

  it('should have no leaks', function () {
    view = createViewFn();

    view.render();

    expect(view).toHaveNoLeaks();
  });

  it('should render dialog classes', function () {
    view = createViewFn();

    view.render();

    expect(view.$el.html()).toContain('Dialog');
    expect(view.$el.html()).toContain('Dialog-contentWrapper');
  });

  it('should not render close button if escapeOptionsDisabled is present', function () {
    view = createViewFn({
      escapeOptionsDisabled: true
    });

    view.render();

    expect(view.$el.html()).not.toContain('js-close');
  });

  it('should not render close button if breadcrumbsEnabled is present', function () {
    view = createViewFn({
      breadcrumbsEnabled: true
    });

    view.render();

    expect(view.$el.html()).toContain('<div class="Dialog-headerWrapper">');
    expect(view.$el.html()).not.toContain('<button class="CDB-Shape js-close Dialog-closeBtn">');
  });

  describe('when close is clicked', function () {
    beforeEach(function () {
      view = createViewFn();

      view.render();

      contentViewModel.trigger('test', 'asd');
      expect(contentViewEventSpy).toHaveBeenCalled();
      contentViewEventSpy.calls.reset();

      jasmine.clock().install();
      spyOn(view, 'hide').and.callThrough();
      spyOn(view, 'clean').and.callThrough();
      spyOn(model, 'destroy').and.callThrough();
      view.$('.js-close').click();
    });

    afterEach(function () {
      jasmine.clock().uninstall();
    });

    it('should destroy the model', function () {
      expect(model.destroy).toHaveBeenCalled();
    });

    it('should hide modal', function () {
      expect(view.hide).toHaveBeenCalled();
    });

    it('should not react to model bindings anymore', function () {
      contentViewModel.trigger('test', 'asd');
      expect(contentViewEventSpy).not.toHaveBeenCalled();
    });

    it('should not clean the view right away', function () {
      expect(view.clean).not.toHaveBeenCalled();
    });

    describe('when the close animation is done', function () {
      beforeEach(function () {
        jasmine.clock().tick(1000);
      });

      it('should have cleaned the view', function () {
        expect(view.clean).toHaveBeenCalled();
      });

      it('should not react to model bindings anymore', function () {
        contentViewModel.trigger('test', 'asd');
        expect(contentViewEventSpy).not.toHaveBeenCalled();
      });

      it('should have no leaks', function () {
        expect(view).toHaveNoLeaks();
      });
    });
  });
});
