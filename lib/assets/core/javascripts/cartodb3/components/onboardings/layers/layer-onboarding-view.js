var $ = require('jquery');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var layerOnboardingKey = require('./layer-onboarding-key');
var checkAndBuildOpts = require('../../../helpers/required-opts');

var REQUIRED_OPTS = [
  'onboardingNotification',
  'editorModel',
  'template',
  'numberOfSteps',
  'modifier'
];

var LEFT_KEY_CODE = 37;
var RIGHT_KEY_CODE = 39;

module.exports = CoreView.extend({
  className: 'LayerOnboarding is-step0 is-opening',

  events: {
    'click .js-start': '_onClickNext',
    'click .js-next': '_onClickNext',
    'click .js-close': '_close'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
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
    this.$el.html(this._template());
    this.$el.addClass('LayerOnboarding' + this._modifier);
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
    var currentStep = this.model.get('step');
    if (currentStep >= 1) {
      this.model.set('step', currentStep - 1);
    }
  },

  _next: function () {
    var currentStep = this.model.get('step');
    if (currentStep < this._numberOfSteps) {
      this.model.set('step', currentStep + 1);
    }
  },

  _onClickNext: function () {
    this._next();
  },

  _onChangeStep: function () {
    var prev = this.model.previous('step');
    var step = this.model.get('step');

    this.$el.removeClass('is-step' + prev, function () {
      this.$el.addClass('is-step' + step);
    }.bind(this));

    this.$('.js-step').removeClass('is-step' + prev, function () {
      this.$('.js-step').addClass('is-step' + step);
    }.bind(this));

    this.$('.LayerOnboarding-body').fadeOut(0).delay(200).fadeIn(100);

    this.$('.LayerOnboarding-step.is-step' + prev).css('display', 'none');
    this.$('.LayerOnboarding-footer.is-step' + prev).css('display', 'none');
    this.$('.LayerOnboarding-step.is-step' + step).css('display', 'block');
    this.$('.LayerOnboarding-footer.is-step' + step).css('display', 'block');

    this.$('.LayerOnboarding-contentBody').css('display', step === 0 ? 'block' : 'none');
  },

  _close: function () {
    this._checkForgetStatus();
    this.trigger('close', this);
  },

  _onKeyDown: function (e) {
    e.stopPropagation();

    if (e.which === LEFT_KEY_CODE) {
      this._prev();
    } else if (e.which === RIGHT_KEY_CODE) {
      this._next();
    }
  },

  _checkForgetStatus: function () {
    if (this.$('.js-forget:checked').val()) {
      this._forget();
    }
  },

  _forget: function () {
    this._onboardingNotification.setKey(layerOnboardingKey, true);
    this._onboardingNotification.save();
  },

  clean: function () {
    $(document).off('keydown', this._keyDown);
    CoreView.prototype.clean.apply(this);
  },

  _setMiddlePad: function (position, padding, body) {
    var $window = $(window);
    var $top = this.$('.LayerOnboarding-pads--left .LayerOnboarding-padTop');
    var $middle = this.$('.LayerOnboarding-pads--left .LayerOnboarding-padMiddle');
    var $bottom = this.$('.LayerOnboarding-pads--left .LayerOnboarding-padBottom');
    var vh = $window.height();
    var vw = $window.width();
    var isSelector = _.isString(position);
    var $el; 
    var width = 0;
    var height = 0;
    var left = 0;
    var top = 0;
    if (isSelector) {
      $el = $(position);
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
    } else if (vw -left <= 0) {
      width = 0;
    }

    // Left offset
    this.$('.LayerOnboarding-toolbarOverlay').outerWidth(left);

    // Right panel
    this.$('.LayerOnboarding-contentWrapper').outerWidth(vw - (left + width));

    // Width
    this.$('.LayerOnboarding-pads--left').outerWidth(width);
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
    this.$('.LayerOnboarding-body').css('top', body && body.top ? body.top : this._defaultBodyPos.top);
    this.$('.LayerOnboarding-body').css('left', body && body.left ? body.left : this._defaultBodyPos.left);
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
