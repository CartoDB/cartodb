var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var checkAndBuildOpts = require('../../../helpers/required-opts');
var template = require('./georeference-view.tpl');
var AnalysesService = require('../../../editor/layers/layer-content-views/analyses/analyses-service');

var REQUIRED_OPTS = [
  'onboardingNotification',
  'name',
  'source',
  'notificationKey'
];

module.exports = CoreView.extend({
  className: 'LayerOnboarding LayerOnboarding--styleGeoreference is-step0 is-opening',

  events: {
    'click .js-georeference': '_onGeoreferenceClicked',
    'click .js-close': '_close'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
    this.model = new Backbone.Model();

    this._initBinds();
  },

  render: function () {
    this.$el.html(template({
      name: this._name
    }));
    return this;
  },

  _initBinds: function () {
    this.listenTo(this.model, 'destroy', this._close);
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
    this._onboardingNotification.setKey(this._notificationKey, true);
    this._onboardingNotification.save();
  },

  _onGeoreferenceClicked: function () {
    this.clean();
    AnalysesService.addGeoreferenceAnalysis();
  },

  clean: function () {
    CoreView.prototype.clean.apply(this);
  }
});
