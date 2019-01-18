var _ = require('underscore');
var OnboardingView = require('builder/components/onboardings/generic/generic-onboarding-view');
var AnalysesService = require('builder/editor/layers/layer-content-views/analyses/analyses-service');
var template = require('./analysis-onboarding.tpl');

module.exports = OnboardingView.extend({
  events: OnboardingView.extendEvents({
    'click .js-add-analysis': '_onAddAnalysisClicked'
  }),

  initialize: function (opts) {
    OnboardingView.prototype.initialize.call(this, _.extend(opts, {
      template: template,
      numberOfSteps: 0,
      modifier: '--analysis'
    }));
  },

  _onAddAnalysisClicked: function () {
    this._forget();

    this.clean();

    AnalysesService.addAnalysis();
  },

  _onChangeStep: function () {
    OnboardingView.prototype._onChangeStep.call(this);

    var step = this.model.get('step');

    if (step === 0) {
      this._setMiddlePad('.js-editorPanel');
    }
  }
});
