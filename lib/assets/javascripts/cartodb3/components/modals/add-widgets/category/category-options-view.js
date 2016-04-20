var cdb = require('cartodb.js');
var CategoryOptionView = require('./category-option-view.js');

/**
 * View to select category widget options
 */
module.exports = cdb.core.View.extend({

  className: 'WidgetList',

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this.collection
      .chain()
      .filter(this._isCategory)
      .each(this._renderOption, this);
    return this;
  },

  _renderOption: function (m) {
    var view = new CategoryOptionView({
      className: 'ModalBlockList-item',
      model: m
    });
    this.addView(view);
    this.$el.append(view.render().el);
  },

  _isCategory: function (m) {
    return m.get('type') === 'category';
  }

});
