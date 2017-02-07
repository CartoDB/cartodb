var cdb = require('cartodb.js');
var $ = require('jquery');
var CoreView = require('backbone/core-view');
var template = require('./analysis-onboarding.tpl');
var checkAndBuildOpts = require('../../../../helpers/required-opts');

var REQUIRED_OPTS = [
  'onboardingNotification',
  'editorModel'
];

var BUILDER_KEY = 'onboarding';

module.exports = CoreView.extend({
  className: 'LayerOnboarding is-step0 is-opening',

  events: {
    'click .js-close': '_close'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._initBinds();
  },

  render: function () {
    this.$el.html(template());

    return this;
  },

  _initBinds: function () {
    this.listenTo(this.model, 'destroy', this._close);
    this.listenTo(this._editorModel, 'change:edition', this._changeEdition);
    this.add_related_model(this._editorModel);
  },

  _changeEdition: function (mdl) {
    var isEditing = !!mdl.get('edition');
    this.$el.toggleClass('is-editing', isEditing);
  },

  _close: function () {
    this._checkForgetStatus();
    this.trigger('close', this);
  },

  _checkForgetStatus: function () {
    if (this.$('.js-forget:checked').val()) {
      this._forget();
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
