var _ = require('underscore');
var cdb = require('cartodb.js');
var WidgetLoaderView = require('./widget-loader-view');
var WidgetErrorView = require('./widget-error-view');
var errorEnhancer = require('../util/error-enhancer');

var PLACEHOLDER_TEMPLATES = {
  category: require('./category/list/items-placeholder-template.tpl'),
  formula: require('./formula/placeholder.tpl'),
  histogram: require('./histogram/placeholder.tpl')
};

/**
 * Default widget view
 * The model is a expected to be widget model
 */
module.exports = cdb.core.View.extend({
  className: 'CDB-Widget CDB-Widget--light',

  options: {
    columns_title: []
  },

  initialize: function () {
    this.listenTo(this.model, 'destroy', this.clean);
    this.listenTo(this.model.dataviewModel, 'all', this._onDataviewModelEvent);
  },

  render: function (error) {
    this.clearSubViews();
    var model = this.model;
    var dataviewModel = model.dataviewModel;
    var placeholder = PLACEHOLDER_TEMPLATES[dataviewModel.get('type')];

    this._appendView(new WidgetLoaderView({
      model: dataviewModel
    }));

    if (error) {
      this._appendView(new WidgetErrorView({
        title: this.model.get('title'),
        error: error,
        model: model,
        placeholder: placeholder
      }));
    } else {
      this._appendView(this.options.contentView);
    }

    return this;
  },

  _onDataviewModelEvent: function (type, error) {
    var enhancedError = errorEnhancer(error);
    if (type.lastIndexOf('error', 0) === 0) {
      return this.render(enhancedError);
    }

    if (type === 'sync' || type === 'change:data') {
      var data = this.model.dataviewModel.get('data');
      if (!data || _.isEmpty(data)) {
        return this.render(errorEnhancer({ type: 'no_data_available' }));
      }
      return this.render();
    }
  },

  _appendView: function (view) {
    this.$el.append(view.render().el);
    this.addView(view);
  }
});
