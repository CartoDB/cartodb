var CoreView = require('backbone/core-view');
var template = require('./analysis-info-pane.tpl');
var ANALYSIS_ANIMATION_TEMPLATES = require('./analysis-animation-templates');

/**
 * View to render an individual analysis category and its analysis options
 */
module.exports = CoreView.extend({
  className: 'Modal-analysisContainer has-dark-text',

  events: {
    'click .js-back': '_onClickBack'
  },

  initialize: function (opts) {
    if (!opts.stackLayoutModel) throw new Error('stackLayoutModel is required');

    this._stackLayoutModel = opts.stackLayoutModel;

    this.collection.on('change:selected', this.render, this);
  },

  render: function () {
    this.clearSubViews();

    var selectedAnalysis = this.collection.find('selected');
    var analysisType;
    var genericType;
    var opts = { title: '', type: '', genericType: '' };

    if (selectedAnalysis) {
      analysisType = selectedAnalysis.get('type');
      var animationTemplate = ANALYSIS_ANIMATION_TEMPLATES[analysisType];

      if (animationTemplate) {
        genericType = animationTemplate.genericType || analysisType;
      }

      opts = {
        genericType: genericType,
        title: selectedAnalysis.get('title'),
        type: analysisType
      };
    }

    this.$el.html(template(opts));

    if (animationTemplate) {
      this.$('.js-animation').append(animationTemplate.template);
    }

    return this;
  },

  _onClickBack: function () {
    this._stackLayoutModel.prevStep();
  }
});
