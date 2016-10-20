var CoreView = require('backbone/core-view');
var ScrollView = require('../../scroll/scroll-view');
var analysisOptions = require('./analysis-options');
var AnalysisCategoryPane = require('./analysis-category-pane');

/**
 * View to add a new analysis node.
 * Expected to be rendered in a modal.
 */
module.exports = CoreView.extend({
  className: 'Dialog-content Dialog-content--expanded',

  initialize: function (opts) {
    if (!opts.modalModel) throw new Error('modalModel is required');
    if (!opts.stackLayoutModel) throw new Error('stackLayoutModel is required');
    if (!opts.analysisOptionsCollection) throw new Error('analysisOptionsCollection is required');
    if (!opts.analysisType) throw new Error('analysisType is required');
    if (!opts.queryGeometryModel) throw new Error('queryGeometryModel is required');

    this._modalModel = opts.modalModel;
    this._stackLayoutModel = opts.stackLayoutModel;
    this._queryGeometryModel = opts.queryGeometryModel;
    this._analysisOptionsCollection = opts.analysisOptionsCollection;
    this._analysisType = opts.analysisType;

    this._analysisOptions = analysisOptions(opts.generateAnalysisOptions);
  },

  render: function () {
    this.clearSubViews();

    var view = new ScrollView({
      createContentView: function () {
        return new AnalysisCategoryPane({
          stackLayoutModel: this._stackLayoutModel,
          collection: this._analysisOptionsCollection,
          title: this.options.categoryTitle || this.options.category,
          category: this._analysisType === 'all' ? null : this._analysisType,
          categoryTitle: this._analysisType === 'all' ? null : this._analysisOptions[this._analysisType].label,
          simpleGeometryType: this._queryGeometryModel.get('simple_geom')
        });
      }.bind(this)
    });

    this.addView(view);
    this.$el.append(view.render().el);

    return this;
  }
});
