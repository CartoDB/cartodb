var cdb = require('cartodb.js');
var WidgetsFormTypesView = require('./widgets-form-types-view');
var WidgetsDataFormView = require('./widgets-form-data-view');

module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.widgetDefinitionModel) throw new Error('widgetDefinitionModel is required');
    if (!opts.layerTableModel) throw new Error('layerTableModel is required');

    this._widgetDefinitionModel = opts.widgetDefinitionModel;
    this._layerTableModel = opts.layerTableModel;

    this._widgetDefinitionModel.on('change:type', this.render, this);

    if (!this._layerTableModel.get('fetched')) {
      this.listenToOnce(this._layerTableModel, 'change:fetched', this.render);
      this._layerTableModel.fetch();
    }
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    // TODO: carousel -> Form Widget Type
    var view = new WidgetsFormTypesView({
      widgetDefinitionModel: this._widgetDefinitionModel,
      layerTableModel: this._layerTableModel
    });
    this.addView(view);
    this.$el.append(view.render().el);

    var formWidgetDataView = new WidgetsDataFormView({
      widgetDefinitionModel: this._widgetDefinitionModel,
      layerTableModel: this._layerTableModel
    });
    this.addView(formWidgetDataView);
    this.$el.append(formWidgetDataView.render().el);

    return this;
  }
});
