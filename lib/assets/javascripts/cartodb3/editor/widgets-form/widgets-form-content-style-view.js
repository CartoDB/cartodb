var cdb = require('cartodb.js');
var WidgetsStyleFormView = require('./widgets-form-style-view');

module.exports = cdb.core.View.extend({
  initialize: function (opts) {
    if (!opts.widgetDefinitionModel) throw new Error('widgetDefinitionModel is required');
    this._widgetDefinitionModel = opts.widgetDefinitionModel;
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();
    return this;
  },

  _initViews: function () {
    var formWidgetStyleView = new WidgetsStyleFormView({
      widgetDefinitionModel: this._widgetDefinitionModel
    });
    this.addView(formWidgetStyleView);
    this.$el.append(formWidgetStyleView.render().el);
  }
});
