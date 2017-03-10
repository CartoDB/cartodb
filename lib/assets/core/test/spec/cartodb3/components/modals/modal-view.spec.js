var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var ModalViewModel = require('../../../../../javascripts/cartodb3/components/modals/modal-view-model');
var ModalView = require('../../../../../javascripts/cartodb3/components/modals/modal-view');

describe('components/modals/modal-view', function () {
  var contentView, contentViewEventSpy;

  beforeEach(function () {
    contentViewEventSpy = jasmine.createSpy('test');
    var TestView = CoreView.extend({
      initialize: function () {
        this.model.on('test', contentViewEventSpy, this);
      }
    });

    this.contentViewModel = new Backbone.Model();
    contentView = new TestView({model: this.contentViewModel});
    spyOn(contentView, 'render').and.callThrough();

    this.model = new ModalViewModel({
      createContentView: function () { return contentView; }
    });
    this.view = new ModalView({
      model: this.model
    });
    this.view.render();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render dialog classes', function () {
    expect(this.view.$el.html()).toContain('Dialog');
    expect(this.view.$el.html()).toContain('Dialog-contentWrapper');
  });

  it('should not render close button if escapeOptionsDisabled is present', function () {
    this.view.options.escapeOptionsDisabled = true;
    this.view.render();
    expect(this.view.$el.html()).not.toContain('js-close');
  });

  describe('when close is clicked', function () {
    beforeEach(function () {
      this.contentViewModel.trigger('test', 'asd');
      expect(contentViewEventSpy).toHaveBeenCalled();
      contentViewEventSpy.calls.reset();

      jasmine.clock().install();
      spyOn(this.view, 'hide').and.callThrough();
      spyOn(this.view, 'clean').and.callThrough();
      spyOn(this.model, 'destroy').and.callThrough();
      this.view.$('.js-close').click();
    });

    afterEach(function () {
      jasmine.clock().uninstall();
    });

    it('should destroy the model', function () {
      expect(this.model.destroy).toHaveBeenCalled();
    });

    it('should hide modal', function () {
      expect(this.view.hide).toHaveBeenCalled();
    });

    it('should not react to model bindings anymore', function () {
      this.contentViewModel.trigger('test', 'asd');
      expect(contentViewEventSpy).not.toHaveBeenCalled();
    });

    it('should not clean the view right away', function () {
      expect(this.view.clean).not.toHaveBeenCalled();
    });

    describe('when the close animation is done', function () {
      beforeEach(function () {
        jasmine.clock().tick(1000);
      });

      it('should have cleaned the view', function () {
        expect(this.view.clean).toHaveBeenCalled();
      });

      it('should not react to model bindings anymore', function () {
        this.contentViewModel.trigger('test', 'asd');
        expect(contentViewEventSpy).not.toHaveBeenCalled();
      });

      it('should have no leaks', function () {
        expect(this.view).toHaveNoLeaks();
      });
    });
  });
});
