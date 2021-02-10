var CoreView = require('backbone/core-view');
var ScrollView = require('builder/components/scroll/scroll-view');
var AnalysisCategoryPane = require('./analysis-category-pane');

/**
 * View to add a new analysis node.
 * Expected to be rendered in a modal.
 */
module.exports = CoreView.extend({
  className: 'Dialog-content Dialog-content--expanded',

  initialize: function (opts) {
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.modalModel) throw new Error('modalModel is required');
    if (!opts.analysisOptionsCollection) throw new Error('analysisOptionsCollection is required');
    if (!opts.analysisType) throw new Error('analysisType is required');
    if (!opts.analysisOptions) throw new Error('analysisOptions is required');
    if (!opts.queryGeometryModel) throw new Error('queryGeometryModel is required');

    this._userModel = opts.userModel;
    this._modalModel = opts.modalModel;
    this._queryGeometryModel = opts.queryGeometryModel;
    this._analysisOptionsCollection = opts.analysisOptionsCollection;
    this._analysisType = opts.analysisType;
    this._analysisOptions = opts.analysisOptions;
  },

  render: function () {
    this.clearSubViews();

    var view = new ScrollView({
      createContentView: function () {
        return new AnalysisCategoryPane({
          collection: this._analysisOptionsCollection,
          title: this.options.categoryTitle || this.options.category,
          category: this._analysisType === 'all' ? null : this._analysisType,
          categoryTitle: this._analysisType === 'all' ? null : this._analysisOptions[this._analysisType].label,
          simpleGeometryType: this._queryGeometryModel.get('simple_geom'),
          userModel: this._userModel
        });
      }.bind(this)
    });

    this.addView(view);
    this.$el.append(view.render().el);

    return this;
  }
});
