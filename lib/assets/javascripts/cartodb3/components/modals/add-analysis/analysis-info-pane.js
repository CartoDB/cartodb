var _ = require('underscore');
var CoreView = require('backbone/core-view');
var template = require('./analysis-info-pane.tpl');
var ANALYSIS_ANIMATION_TEMPLATES = require('./analysis-animation-templates');

/**
 * View to render an individual analysis category and its analysis options
 */
module.exports = CoreView.extend({
  className: 'Modal',

  events: {
    'click .js-back': '_onClickBack',
    'click .js-add': '_onAddAnalysis'
  },

  initialize: function (opts) {
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.modalModel) throw new Error('modalModel is required');
    if (!opts.stackLayoutModel) throw new Error('stackLayoutModel is required');

    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._modalModel = opts.modalModel;
    this._stackLayoutModel = opts.stackLayoutModel;

    this.collection.on('change:selected', this.render, this);
  },

  render: function () {
    this.clearSubViews();

    var selectedAnalysis = this.collection.find('selected');
    var analysisType;
    var genericType;
    var opts = { title: '', category: '', type: '', genericType: '', analysisParams: '' };

    if (selectedAnalysis) {
      var analysisParams = {};
      analysisType = selectedAnalysis.get('type');
      var animationTemplate = ANALYSIS_ANIMATION_TEMPLATES[analysisType];

      if (animationTemplate) {
        genericType = animationTemplate.genericType || analysisType;
        analysisParams = animationTemplate.params || {};
      }

      opts = {
        type: analysisType,
        genericType: genericType,
        category: selectedAnalysis.get('category').replace(/_/g, '-'),
        title: selectedAnalysis.get('title'),
        analysisParams: analysisParams
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
  },

  _isSelected: function (m) {
    return !!m.get('selected');
  },

  _onAddAnalysis: function () {
    var selectedOptionModel = this.collection.find(this._isSelected);

    if (selectedOptionModel) {
      var analysisFormAttrs = selectedOptionModel.getFormAttrs(this._layerDefinitionModel);
      this._modalModel.destroy(analysisFormAttrs);
    }
  }
});
