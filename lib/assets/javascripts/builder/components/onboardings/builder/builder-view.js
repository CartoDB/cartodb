var $ = require('jquery');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var template = require('./builder-view.tpl');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var GAPusher = require('builder/helpers/ga-pusher');

var BUILDER_KEY = 'onboarding';

var LEFT_KEY_CODE = 37;
var RIGHT_KEY_CODE = 39;

var REQUIRED_OPTS = [
  'userModel',
  'onboardingNotification',
  'editorModel'
];

module.exports = CoreView.extend({
  className: 'BuilderOnboarding is-step0 is-opening',

  events: {
    'click .js-start': '_onClickNext',
    'click .js-next': '_onClickNext',
    'click .js-close': '_close'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._initModels();
    this._initBinds();
  },

  render: function () {
    this.$el.html(template({
      name: this._userModel.get('name') || this._userModel.get('username')
    }));

    return this;
  },

  _initModels: function () {
    this.model = new Backbone.Model({
      step: 0
    });
  },

  _initBinds: function () {
    this._keyDown = this._onKeyDown.bind(this);
    $(document).on('keydown', this._keyDown);

    this.listenTo(this.model, 'change:step', this._onChangeStep);
    this.listenTo(this.model, 'destroy', this._close);
    this.listenTo(this._editorModel, 'change:edition', this._changeEdition);
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
    if (this._currentStep() <= 3) {
      this.model.set('step', this._currentStep() + 1);
    }
  },

  _currentStep: function () {
    return this.model.get('step');
  },

  _onClickNext: function () {
    this._next();
  },

  _onChangeStep: function () {
    var self = this;

    this.$el.removeClass('is-step' + this.model.previous('step'), function () {
      self.$el.addClass('is-step' + self._currentStep());
    });

    this.$('.js-step').removeClass('is-step' + this.model.previous('step'), function () {
      self.$('.js-step').addClass('is-step' + self._currentStep());
    });
  },

  _close: function () {
    this._forget();

    GAPusher({
      eventName: 'send',
      hitType: 'event',
      eventCategory: 'Edit your Map',
      eventAction: 'click',
      eventLabel: 'Builder'
    });

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

  _forget: function () {
    this._onboardingNotification.setKey(BUILDER_KEY, true);
    this._onboardingNotification.save();
  },

  clean: function () {
    $(document).off('keydown', this._keyDown);
    CoreView.prototype.clean.apply(this);
  }
});
