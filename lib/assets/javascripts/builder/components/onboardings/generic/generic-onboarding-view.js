var $ = require('jquery');
var Backbone = require('backbone');
var _ = require('underscore');
var CoreView = require('backbone/core-view');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'onboardingNotification',
  'editorModel',
  'template',
  'numberOfSteps',
  'selector',
  'modifier',
  'notificationKey'
];

var LEFT_KEY_CODE = 37;
var RIGHT_KEY_CODE = 39;

module.exports = CoreView.extend({
  className: 'is-step0 is-opening',

  events: {
    'click .js-start': '_onClickNext',
    'click .js-next': '_onClickNext',
    'click .js-close': '_close',
    'click .js-highlight': '_close'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
    this.$el.addClass(this._selector);
    this.model = new Backbone.Model({
      step: -1
    });
    this._defaultBodyPos = {
      top: 32,
      left: 380
    };

    this._keyDown = this._onKeyDown.bind(this);
    this._initBinds();
  },

  render: function () {
    this.$el.addClass(this._selector + this._modifier);
    this.$el.html(this._template());
    if (this.model.get('step') === -1) {
      this._next();
    }
    return this;
  },

  _initBinds: function () {
    this.listenTo(this.model, 'destroy', this._close);
    this.listenTo(this.model, 'change:step', this._onChangeStep);
    this.listenTo(this._editorModel, 'change:edition', this._changeEdition);
    $(document).on('keydown', this._keyDown);
  },

  _changeEdition: function (mdl) {
    var isEditing = !!mdl.get('edition');
    this.$el.toggleClass('is-editing', isEditing);
  },

  _prev: function () {
    if (this._currentStep() >= 1) {
      this.model.set('step', this._currentStep() - 1);
    }
  },

  _next: function () {
    if (this._currentStep() < this._numberOfSteps) {
      this.model.set('step', this._currentStep() + 1);
    }
  },

  _currentStep: function () {
    return this.model.get('step');
  },

  _onClickNext: function (event) {
    if (event) event.stopPropagation();
    this._next();
  },

  _onChangeStep: function () {
    var prev = this.model.previous('step');
    var step = this.model.get('step');

    this.$el.removeClass('is-step' + prev, function () {
      this.$el.addClass('is-step' + step);
    }.bind(this));

    this.$('.js-step').removeClass('is-step' + prev).addClass('is-step' + step);

    this.$('.' + this._selector + '-body').fadeOut(0).delay(200).fadeIn(100);

    this.$('.' + this._selector + '-step.is-step' + prev).css('display', 'none');
    this.$('.' + this._selector + '-footer.is-step' + prev).css('display', 'none');
    this.$('.' + this._selector + '-step.is-step' + step).css('display', 'block');
    this.$('.' + this._selector + '-footer.is-step' + step).css('display', 'block');

    this.$('.' + this._selector + '-contentBody').css('display', step === 0 ? 'block' : 'none');
  },

  _close: function () {
    this._forget();
    this.trigger('close', this);
  },

  _onKeyDown: function (event) {
    event.stopPropagation();

    if (event.which === LEFT_KEY_CODE) {
      this._prev();
    } else if (event.which === RIGHT_KEY_CODE) {
      this._next();
    }
  },

  _forget: function () {
    this._onboardingNotification.setKey(this._notificationKey, true);
    this._onboardingNotification.save();
  },

  clean: function () {
    $(document).off('keydown', this._keyDown);
    CoreView.prototype.clean.apply(this);
  },

  _setMiddlePad: function (position, padding, body) {
    var $window = $(window);
    var $top = this.$('.' + this._selector + '-pads--left .' + this._selector + '-padTop');
    var $middle = this.$('.' + this._selector + '-pads--left .' + this._selector + '-padMiddle');
    var $bottom = this.$('.' + this._selector + '-pads--left .' + this._selector + '-padBottom');
    var vh = $window.height();
    var vw = $window.width();
    var isSelector = _.isString(position);
    var $el = $(position);
    var width = 0;
    var height = 0;
    var left = 0;
    var top = 0;
    if ($el.length === 0) return;

    if (isSelector) {
      width = $el.outerWidth();
      height = $el.outerHeight();
      left = $el.offset().left;
      top = $el.offset().top;
    } else {
      width = position.width;
      height = position.height;
      left = position.left;
      top = position.top;
    }

    // Apply padding
    var appliedPadding = this._buildPadding(padding);
    top -= appliedPadding.top;
    left -= appliedPadding.left;
    width += appliedPadding.left + appliedPadding.right;
    height += appliedPadding.top + appliedPadding.bottom;

    // Is it place outside the viewport?
    if (vw - left > 0 && vw - left < width) {
      width = vw - left;
    } else if (vw - left <= 0) {
      width = 0;
    }

    // Left offset
    this.$('.' + this._selector + '-toolbarOverlay').outerWidth(left);

    // Right panel
    this.$('.' + this._selector + '-contentWrapper').outerWidth(vw - (left + width));

    // Width
    this.$('.' + this._selector + '-pads--left').outerWidth(width);
    $top.outerWidth(width);
    $middle.outerWidth(width);
    $bottom.outerWidth(width);

    // Height
    var topHeight = top;
    var middleHeight = height;
    var bottomHeight = vh - (topHeight + middleHeight);

    $top.outerHeight(topHeight);
    $middle.outerHeight(middleHeight);
    $bottom.outerHeight(bottomHeight);

    // Body text
    this.$('.' + this._selector + '-body').css('top', body && body.top ? body.top : this._defaultBodyPos.top);
    this.$('.' + this._selector + '-body').css('left', body && body.left ? body.left : this._defaultBodyPos.left);
  },

  _buildPadding: function (padding) {
    var result = {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    };

    if (padding) {
      result.top = this._calculatePadding(padding.top);
      result.right = this._calculatePadding(padding.right);
      result.bottom = this._calculatePadding(padding.bottom);
      result.left = this._calculatePadding(padding.left);
    }

    return result;
  },

  _calculatePadding: function (padding) {
    return (padding && _.isFinite(padding)) ? padding : 0;
  }
});
