var CoreView = require('backbone/core-view');
var template = require('./analysis-info-pane.tpl');
var Analyses = require('../../../data/analyses');

/**
 * View to render an individual analysis category and its analysis options
 */
module.exports = CoreView.extend({
  className: 'Modal',

  events: {
    'click .js-back': '_onClickBack',
    'click .js-backToCategory': '_onClickBackToCategory',
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
      var analysisItem = Analyses.getAnalysisByType(analysisType);
      var animationTemplate = analysisItem && analysisItem.animationTemplate;

      if (animationTemplate) {
        genericType = analysisItem.genericType || analysisType;
        analysisParams = analysisItem.animationParams || {};
      }

      this._analysisCategoryName = selectedAnalysis.get('category');

      opts = {
        type: analysisType,
        genericType: genericType,
        category: this._analysisCategoryName.replace(/_/g, '-'),
        title: selectedAnalysis.get('title'),
        analysisParams: analysisParams
      };
    }

    this.$el.html(template(opts));

    if (animationTemplate) {
      this.$('.js-animation').append(animationTemplate);
    }

    return this;
  },

  _onClickBackToCategory: function () {
    this.trigger('backToCategory', this._analysisCategoryName, this);
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
