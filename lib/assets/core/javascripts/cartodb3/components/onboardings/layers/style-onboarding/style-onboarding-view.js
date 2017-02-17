var _ = require('underscore');
var OnboardingView = require('../layer-onboarding-view');
var defaultTemplate = require('./style-onboarding.tpl');
var pointsTemplate = require('./style-points-onboarding.tpl');
var emptyTemplate = require('./style-empty-onboarding.tpl');
var checkAndBuildOpts = require('../../../../helpers/required-opts');

var REQUIRED_OPTS = [
  'geom',
  'type',
  'name'
];

module.exports = OnboardingView.extend({
  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    var template = defaultTemplate;
    var steps = 2;
    var modifier = '--style';

    if (_.isEmpty(this._geom)) {
      template = emptyTemplate;
      steps = 1;
      modifier = '--styleGeoreference';
    } else if (this._geom === 'point') {
      template = pointsTemplate;
      steps = 3;

      switch (this._type) {
        case 'simple':
        case 'heatmap':
        case 'animation':
          modifier = '--stylePointsSimpleAggregation';
          break;
        case 'squares':
        case 'hexabins':
        case 'regions':
          modifier = '--stylePointsDoubleAggregation';
          break;
        default:
          modifier = '--stylePointsSimpleAggregation';
          break;
      }
    }

    OnboardingView.prototype.initialize.call(this, _.extend(opts, {
      template: template,
      numberOfSteps: steps,
      modifier: modifier
    }));
  },

  render: function () {
    this.$el.html(this._template({
      name: this._name
    }));
    this.$el.addClass('LayerOnboarding' + this._modifier);

    return this;
  }
});
