var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var StackLayoutView = require('../../../components/stack-layout/stack-layout-view');
var AnalysisCategoryPane = require('./analysis-category-pane');
var AnalysisInfoPane = require('./analysis-info-pane');

/**
 * View to render an individual analysis category and its analysis options
 */
module.exports = CoreView.extend({

  className: 'Modal-analysisContainer',

  options: {
    category: '',
    categoryTitle: '',
    simpleGeometryType: ''
  },

  render: function () {
    this.clearSubViews();

    var stackViewCollection = new Backbone.Collection([{
      createStackView: function (stackLayoutModel, opts) {
        return new AnalysisCategoryPane({
          stackLayoutModel: stackLayoutModel,
          collection: this.collection,
          title: this.options.categoryTitle || this.options.category,
          category: this.options.category,
          simpleGeometryType: this.options.simpleGeometryType
        });
      }.bind(this)
    }, {
      createStackView: function (stackLayoutModel, opts) {
        return new AnalysisInfoPane({
          collection: this.collection
        });
      }.bind(this)
    }]);

    this._stackLayoutView = new StackLayoutView({
      className: 'Editor-content',
      collection: stackViewCollection
    });

    this.$el.append(this._stackLayoutView.render().$el);
    this.addView(this._stackLayoutView);

    return this;
  }
});
