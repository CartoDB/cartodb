var $ = require('jquery');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var checkAndBuildOpts = require('../../../helpers/required-opts');

var REQUIRED_OPTS = [
  'onboardingNotification',
  'editorModel',
  'template',
  'numberOfSteps',
  'notificationKey',
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
      step: 0
    });

    this._keyDown = this._onKeyDown.bind(this);
    this._initBinds();
  },

  render: function () {
    this.$el.html(this._template());
    this.$el.addClass('LayerOnboarding' + this._modifier);
    return this;
  },

  _initBinds: function () {
    this.listenTo(this.model, 'change:step', this._onChangeStep);
    this.listenTo(this.model, 'destroy', this._close);
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
    this.$el.removeClass('is-step' + this.model.previous('step'), function () {
      this.$el.addClass('is-step' + this.model.get('step'));
    }.bind(this));

    this.$('.js-step').removeClass('is-step' + this.model.previous('step'), function () {
      this.$('.js-step').addClass('is-step' + this.model.get('step'));
    }.bind(this));
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
    this._onboardingNotification.setKey(this._notificationKey, true);
    this._onboardingNotification.save();
  },

  clean: function () {
    $(document).off('keydown', this._keyDown);
    CoreView.prototype.clean.apply(this);
  }
});
