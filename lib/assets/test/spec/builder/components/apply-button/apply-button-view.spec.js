var Backbone = require('backbone');
var ApplyButtonView = require('builder/components/apply-button/apply-button-view');
var ApplyButtonTemplate = require('builder/components/apply-button/apply-button.tpl');

describe('components/apply-button-view', function () {
  var view, overlayModel, onApplyClick;

  var createViewFn = function (options) {
    overlayModel = new Backbone.Model({
      visible: options.visible
    });

    onApplyClick = jasmine.createSpy();

    var view = new ApplyButtonView({
      onApplyClick: onApplyClick,
      overlayModel: overlayModel
    });

    spyOn(view, '_onClick').and.callThrough();

    return view;
  };

  beforeEach(function () {
    view = createViewFn({
      visible: false
    });
    view.render();
  });

  describe('.render', function () {
    it('should have no leaks', function () {
      expect(view).toHaveNoLeaks();
    });

    it('should render apply button', function () {
      expect(view.$el.html()).toBe(ApplyButtonTemplate({ disabled: overlayModel.get('visible') }));
    });
  });

  describe('._initBinds', function () {
    it('should listen to _overlayModel:visible and call .render()', function () {
      spyOn(view, 'render');

      view._initBinds();
      overlayModel.trigger('change:visible');

      expect(view.render).toHaveBeenCalled();
    });
  });

  describe('._onClick', function () {
    beforeEach(function () {
      onApplyClick.calls.reset();
    });

    it('should execute callback if not disabled', function () {
      view = createViewFn({
        visible: false
      });

      view._onClick();

      expect(onApplyClick).toHaveBeenCalled();
      expect(view._onClick).toHaveBeenCalled();
    });

    it('should not execute callback if disabled', function () {
      view = createViewFn({
        visible: true
      });

      view._onClick();

      expect(view._onClick).toHaveBeenCalled();
      expect(onApplyClick).not.toHaveBeenCalled();
    });
  });
});
