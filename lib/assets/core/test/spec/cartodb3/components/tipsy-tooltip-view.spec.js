var _ = require('underscore');
var $ = require('jquery');
var TipsyTooltipView = require('../../../../javascripts/cartodb3/components/tipsy-tooltip-view');

describe('components/tipsy-tooltip-view', function () {
  var view;

  var createViewFn = function (options) {
    var $el = $('div');
    spyOn($el, 'tipsy').and.callThrough();

    var defaultOptions = {
      el: $el,
      title: function () {
        return 'help';
      }
    };

    var view = new TipsyTooltipView(_.extend(defaultOptions, options));

    return view;
  };

  beforeEach(function () {
    view = createViewFn();
  });

  describe('.render', function () {
    it('should have no leaks', function () {
      view.render();

      expect(view).toHaveNoLeaks();
    });
  });

  describe('._initTipsy', function () {
    it('should init tipsy', function () {
      expect(view.$el.tipsy).toHaveBeenCalled();
      expect(view.$el.data('tipsy')).toBeDefined();
      expect(view.tipsy).toBeDefined();
    });
  });

  describe('.showTipsy', function () {
    it('should show tipsy', function () {
      view.$el.tipsy = jasmine.createSpy();

      view.showTipsy();

      expect(view.$el.tipsy).toHaveBeenCalledWith('show');
    });
  });

  describe('.hideTipsy', function () {
    it('should hide tipsy', function () {
      view.$el.tipsy = jasmine.createSpy();

      view.hideTipsy();

      expect(view.$el.tipsy).toHaveBeenCalledWith('hide');
    });
  });

  describe('.destroyTipsy', function () {
    it('should destroy tipsy', function () {
      spyOn(view.tipsy, 'hide');

      view.destroyTipsy();

      expect(view.$el.data('tipsy')).toBeUndefined();
      expect(view.tipsy).toBeUndefined();
    });
  });

  describe('.clean', function () {
    it('should destroy tipsy', function () {
      spyOn(view, 'destroyTipsy');

      view.clean();

      expect(view.destroyTipsy).toHaveBeenCalled();
    });
  });

  describe('has mouse enter action', function () {
    describe('._onMouseEnter', function () {
      it('should trigger action', function () {
        var mouseEnterAction = jasmine.createSpy();
        view = createViewFn({
          mouseEnterAction: mouseEnterAction
        });

        view._onMouseEnter();

        expect(mouseEnterAction).toHaveBeenCalled();
      });
    });
  });

  describe('has mouse leave action', function () {
    describe('._onMouseLeave', function () {
      it('should trigger action', function () {
        var mouseLeaveAction = jasmine.createSpy();
        view = createViewFn({
          mouseLeaveAction: mouseLeaveAction
        });

        view._onMouseLeave();

        expect(mouseLeaveAction).toHaveBeenCalled();
      });
    });
  });

  describe('tipsy opened manually', function () {
    describe('.destroyTipsy', function () {
      it('should destroy tipsy', function () {
        view = createViewFn({
          trigger: 'manual'
        });
        spyOn(view, 'hideTipsy');

        view.destroyTipsy();

        expect(view.hideTipsy).toHaveBeenCalled();
      });
    });
  });
});
