var _ = require('underscore');
var sanitize = require('../../core/sanitize');
var Template = require('../../core/template');
var View = require('../../core/view');

var FADE_IN_DURATION = 200;
var FADE_OUT_DURATION = 100;
var FADE_TIMEOUT = 50;

var TooltipView = View.extend({
  defaultTemplate: '<p>{{text}}</p>',
  className: 'CDB-Tooltip-wrapper',

  initialize: function (options) {
    if (!options.mapView) {
      throw new Error('mapView should be present');
    }

    this._mapView = options.mapView;

    this.showing = false;
    this.showhideTimeout = null;

    this.model.bind('change:visible', this._showOrHide, this);
    this.model.bind('change:position', this._updatePosition, this);
    this.model.bind('change:placement', this._updatePosition, this);
    this.model.bind('change:content change:alternative_names', this.render, this);
  },

  template: function (data) {
    var compiledTemplate = Template.compile(this.model.get('template'), 'mustache');
    return compiledTemplate(data);
  },

  render: function () {
    var content = this.model.get('content');
    var sanitizedOutput = sanitize.html(this.template(content));
    this.$el.html(sanitizedOutput);
    this._updatePosition();
    return this;
  },

  _showOrHide: function () {
    if (this.model.isVisible()) {
      this._show();
    } else {
      this._hide();
    }
  },

  _hide: function () {
    var self = this;
    var fadeOut = function () {
      self.$el.fadeOut(FADE_OUT_DURATION);
    };

    clearTimeout(this.showhideTimeout);
    this.showhideTimeout = setTimeout(fadeOut, FADE_TIMEOUT);
  },

  _show: function () {
    this.render();

    var self = this;
    var fadeIn = function () {
      self.$el.fadeIn(FADE_IN_DURATION);
    };

    clearTimeout(this.showhideTimeout);
    this.showhideTimeout = setTimeout(fadeIn, FADE_TIMEOUT);
  },

  _updatePosition: function () {
    var position = this.model.get('position');
    var placement = this.model.get('placement');
    var height = this.$el.innerHeight();
    var width = this.$el.innerWidth();
    var mapViewSize = this._mapView.getSize();
    var top = 0;
    var left = 0;
    var modifierClass = 'CDB-Tooltip-wrapper--';

    // Remove any position modifier
    this._removePositionModifiers();

    // Vertically
    if (placement.indexOf('top') !== -1) {
      top = position.y - height;
    } else if (placement.indexOf('middle') !== -1) {
      top = position.y - (height / 2);
    } else { // bottom
      top = position.y;
    }

    // Fix vertical overflow
    if (top < 0) {
      top = position.y;
      modifierClass += 'top';
    } else if (top + height > mapViewSize.y) {
      top = position.y - height;
      modifierClass += 'bottom';
    } else {
      modifierClass += 'top';
    }

    // Horizontally
    if (placement.indexOf('left') !== -1) {
      left = position.x - width;
    } else if (placement.indexOf('center') !== -1) {
      left = position.x - (width / 2);
    } else { // right
      left = position.x;
    }

    // Fix horizontal overflow
    if (left < 0) {
      left = position.x;
      modifierClass += 'Left';
    } else if (left + width > mapViewSize.x) {
      left = position.x - width;
      modifierClass += 'Right';
    } else {
      modifierClass += 'Left';
    }

    // Add offsets
    top += this.model.getVerticalOffset();
    left += this.model.getHorizontalOffset();

    this.$el.css({
      top: top,
      left: left
    }).addClass(modifierClass);
  },

  _removePositionModifiers: function () {
    var positions = [ 'topLeft', 'topRight', 'bottomRight', 'bottomLeft' ];
    var positionModifiers = _.map(positions, function (className) {
      return this._modifierClassName(className);
    }, this);
    this.$el.removeClass(positionModifiers.join(' '));
  },

  _modifierClassName: function (className) {
    return this.className + '--' + className;
  }
});

module.exports = TooltipView;
