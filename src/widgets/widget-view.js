var cdb = require('cartodb.js');
var WidgetLoaderView = require('./widget-loader-view');
var WidgetErrorView = require('./widget-error-view');

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
  },

  render: function () {
    var dataviewModel = this.model.dataviewModel;
    if (dataviewModel) {
      this._appendView(new WidgetLoaderView({
        model: dataviewModel
      }));

      this._appendView(new WidgetErrorView({
        model: dataviewModel
      }));
    }

    this._appendView(this.options.contentView);
    return this;
  },

  _appendView: function (view) {
    this.$el.append(view.render().el);
    this.addView(view);
  }
});
