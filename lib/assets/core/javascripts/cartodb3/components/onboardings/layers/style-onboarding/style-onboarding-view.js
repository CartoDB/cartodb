var _ = require('underscore');
var OnboardingView = require('../layer-onboarding-view');
var defaultTemplate = require('./style-onboarding.tpl');
var pointsTemplate = require('./style-points-onboarding.tpl');

module.exports = OnboardingView.extend({
  initialize: function (opts) {
    if (opts.geom === void 0) {
      throw new Error('geom is required');
    }
    if (opts.type === void 0) {
      throw new Error('type is required');
    }

    console.log('Type: ' + opts.type);

    var template = defaultTemplate;
    var steps = 2;
    var modifier = '--style';

    if (opts.geom === 'point') {
      template = pointsTemplate;
      steps = 3;
      modifier = '--stylePointsSimpleAggregation';

      switch (opts.type) {
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
  }
});
