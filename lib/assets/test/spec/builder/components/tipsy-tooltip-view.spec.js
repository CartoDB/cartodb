var _ = require('underscore');
var $ = require('jquery');
var TipsyTooltipView = require('builder/components/tipsy-tooltip-view');

describe('components/tipsy-tooltip-view', function () {
  var view;

  var createViewFn = function (options) {
    var $el = $('<div></div>');
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

  describe('.getAutoGravity', function () {
    var windowMock = {
      innerHeight: 1024,
      innerWidth: 768,
      pageXOffset: 0,
      pageYOffset: 0
    };

    it('should return first preferred gravity if there is no tooltipElement', function () {
      var gravityPosition = TipsyTooltipView.prototype.getOptimalGravity(['n'], 0, windowMock)();

      expect(gravityPosition).toBe('n');
    });

    it('should return first valid gravity', function () {
      var preferredGravities = ['s', 'n'];
      var tooltip = {
        offsetHeight: 50,
        offsetWidth: 100
      };

      var tooltipContainer = {
        getBoundingClientRect: function () {
          return {
            top: 0,
            left: 100,
            width: 20,
            height: 20
          };
        }
      };

      var getOptimalGravity = TipsyTooltipView.prototype.getOptimalGravity(preferredGravities, 0, windowMock);
      var autoGravityValue = getOptimalGravity.bind(tooltipContainer)(tooltip);

      expect(autoGravityValue).toBe('n');
    });

    it('should add tooltip body gravity if horizontal alignment is not possible', function () {
      var preferredGravities = ['s', 'n'];
      var tooltip = {
        offsetHeight: 50,
        offsetWidth: 100
      };

      var tooltipContainer = {
        getBoundingClientRect: function () {
          return {
            top: 100,
            left: 0,
            width: 20,
            height: 20
          };
        }
      };

      var getOptimalGravity = TipsyTooltipView.prototype.getOptimalGravity(preferredGravities, 0, windowMock);
      var autoGravityValue = getOptimalGravity.bind(tooltipContainer)(tooltip);

      expect(autoGravityValue).toBe('sw');
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
