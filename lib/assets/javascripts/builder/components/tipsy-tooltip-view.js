var _ = require('underscore');
var CoreView = require('backbone/core-view');
require('tipsy');

/**
 *  Tipsy tooltip view.
 *
 *  - Needs an element to work.
 *  - Inits tipsy library.
 *  - Clean bastard tipsy bindings easily.
 *
 */

module.exports = CoreView.extend({
  options: {
    gravity: 's',
    opacity: 1,
    fade: true
  },

  events: {
    'mouseenter': '_onMouseEnter',
    'mouseleave': '_onMouseLeave'
  },

  initialize: function (opts) {
    if (!opts.el) throw new Error('Element is needed to have tipsy tooltip working');

    this._mouseEnterAction = opts.mouseEnterAction;
    this._mouseLeaveAction = opts.mouseLeaveAction;
    this._tipsyOpenedManually = opts.trigger === 'manual';

    this._initTipsy();
  },

  _initTipsy: function () {
    var options = _.clone(this.options);

    if (options.gravity === 'auto') {
      options.gravity = this.getOptimalGravity(
        options.gravityConfiguration && options.gravityConfiguration.preferredGravities || ['s', 'n', 'e', 'w'],
        options.gravityConfiguration && options.gravityConfiguration.margin || 0,
        window
      );
    }

    if (!options.title) {
      options.title = this.getTitleFromDataAttribute;
    }

    this.$el.tipsy(options);
    this.tipsy = this.$el.data('tipsy');
  },

  _onMouseEnter: function () {
    this._mouseEnterAction && this._mouseEnterAction();
  },

  _onMouseLeave: function () {
    this._mouseLeaveAction && this._mouseLeaveAction();
  },

  setOffset: function (offset) {
    this.tipsy.options.offset = offset;
  },

  showTipsy: function () {
    this.$el.tipsy('show');
  },

  hideTipsy: function () {
    this.$el.tipsy('hide');
  },

  getElement: function () {
    return this.el;
  },

  getOptimalGravity: function (preferredGravities, margin, browserWindow) {
    return function (tooltipElement) {
      if (!tooltipElement) {
        return preferredGravities[0] || 'n';
      }

      var tooltipContainer = this;
      var tooltipContainerBoundingRect = tooltipContainer.getBoundingClientRect();
      var gravityOptions = { n: 'bottom', s: 'top', w: 'right', e: 'left' };

      var viewportBoundaries = {
        top: browserWindow.pageYOffset + margin,
        right: browserWindow.innerWidth + browserWindow.pageXOffset - margin,
        bottom: browserWindow.innerHeight + browserWindow.pageYOffset - margin,
        left: browserWindow.pageXOffset + margin
      };

      var tooltipBoundaries = {
        top: tooltipContainerBoundingRect.top - tooltipElement.offsetHeight,
        right: tooltipContainerBoundingRect.left + tooltipContainerBoundingRect.width + tooltipElement.offsetWidth,
        bottom: tooltipContainerBoundingRect.top + tooltipContainerBoundingRect.height + tooltipElement.offsetHeight,
        left: tooltipContainerBoundingRect.left - tooltipElement.offsetWidth
      };

      var tooltipBodyGravity = '';
      var optimalGravity = _.find(preferredGravities, function (gravity) {
        var position = gravityOptions[gravity];
        var tooltipFitsPosition = isTooltipInsideViewport(position, viewportBoundaries[position], tooltipBoundaries[position]);

        if (tooltipFitsPosition && (position === 'top' || position === 'bottom')) {
          tooltipBodyGravity = getTooltipBodyGravity(gravityOptions, viewportBoundaries, tooltipBoundaries);
        }

        return tooltipFitsPosition;
      });

      return optimalGravity ? optimalGravity + tooltipBodyGravity : preferredGravities[0];
    };
  },

  getTitleFromDataAttribute: function () {
    return this.getAttribute('data-tooltip');
  },

  destroyTipsy: function () {
    if (this.tipsy) {
      // tipsy does not return this
      this.tipsy.hide();
      this.$el.unbind('mouseleave mouseenter');
    }

    if (this._tipsyOpenedManually) {
      this.hideTipsy();
    }

    this.$el.removeData('tipsy');
    delete this.tipsy;
  },

  clean: function () {
    this.destroyTipsy();
  }
});

var isTooltipInsideViewport = function (bound, viewportBound, tooltipBound) {
  if (bound === 'top' || bound === 'left') {
    return viewportBound <= tooltipBound;
  }

  if (bound === 'right' || bound === 'bottom') {
    return viewportBound >= tooltipBound;
  }
};

var getTooltipBodyGravity = function (gravityOptions, viewportBoundaries, tooltipBoundaries) {
  var nonCollisioningEdges = _.filter(['e', 'w'], function (edge) {
    var bound = gravityOptions[edge];
    return isTooltipInsideViewport(bound, viewportBoundaries[bound], tooltipBoundaries[bound]);
  });

  if (nonCollisioningEdges.length === 1) {
    return nonCollisioningEdges[0];
  }

  return '';
};
