var CoreView = require('backbone/core-view');
var AnalysisOptionView = require('./analysis-option-view');
var template = require('./analysis-category.tpl');

/**
 * View to render an individual analysis category and its analysis options
 */
module.exports = CoreView.extend({

  className: 'Modal-analysisContainer',

  options: {
    category: '',
    categoryTitle: '',
    simpleGeometryType: '',
    userModel: null
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(this._html());
    this.collection.each(this._renderOption, this);

    return this;
  },

  _html: function () {
    return template({
      title: this.options.title
    });
  },

  _renderOption: function (analysisOptionModel) {
    if (this.options.category && !analysisOptionModel.belongsTo(this.options.category)) {
      return;
    }

    var view = new AnalysisOptionView({
      model: analysisOptionModel,
      simpleGeometryTypeInput: this.options.simpleGeometryType,
      userModel: this.options.userModel
    });

    this.addView(view);
    this._$list().append(view.render().el);
  },

  _$list: function () {
    return this.$('.js-analyses-list');
  }
});
