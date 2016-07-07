var CoreView = require('backbone/core-view');
var WidgetsStyleFormView = require('./widgets-form-style-view');

module.exports = CoreView.extend({

  initialize: function (opts) {
    if (!opts.userActions) throw new Error('userActions is required');
    if (!opts.widgetDefinitionModel) throw new Error('widgetDefinitionModel is required');

    this._userActions = opts.userActions;
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
      userActions: this._userActions,
      widgetDefinitionModel: this._widgetDefinitionModel
    });
    this.addView(formWidgetStyleView);
    this.$el.append(formWidgetStyleView.render().el);
  }

});
