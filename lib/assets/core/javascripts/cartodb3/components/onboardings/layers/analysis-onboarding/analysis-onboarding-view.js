var _ = require('underscore');
var $ = require('jquery');
var OnboardingView = require('../layer-onboarding-view');
var AnalysesService = require('../../../../editor/layers/layer-content-views/analyses/analyses-service');
var template = require('./analysis-onboarding.tpl');

module.exports = OnboardingView.extend({
  events: OnboardingView.extendEvents({
    'click .js-add-analysis': '_onAddAnalysisClicked'
  }),

  initialize: function (opts) {
    OnboardingView.prototype.initialize.call(this, _.extend(opts, {
      template: template,
      numberOfSteps: 1,
      modifier: '--analysis'
    }));
  },

  _onAddAnalysisClicked: function () {
    this._checkForgetStatus();
    this.clean();
    AnalysesService.addAnalysis();
  },

  _onChangeStep: function () {
    OnboardingView.prototype._onChangeStep.call(this);

    var step = this.model.get('step');
    var vh = $(window).height();

    if (step === 0) {
      this._setMiddlePad('.js-editorPanel');
    }
  }
});
