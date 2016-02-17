var cdb = require('cartodb.js');
var $ = require('jquery');
var WidgetFormFactory = require('./widgets-form-factory');
var WidgetsDataFormView = require('./widgets-form-data-view');
var typesTemplate = require('./types.tpl');

module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.tableModel) throw new Error('tableModel is required');
    if (!opts.widgetDefinitionModel) throw new Error('widgetDefinitionModel is required');
    this._tableModel = opts.tableModel;
    this._widgetDefinitionModel = opts.widgetDefinitionModel;
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();
    return this;
  },

  _initViews: function () {
    var self = this;

    // TODO: carousel -> Form Widget Type
    var types = WidgetFormFactory.getDataTypes(this._tableModel);

    var $typeSelect = $(typesTemplate({
      types: types,
      title: _t('editor.widgets.widgets-form.type.title'),
      description: _t('editor.widgets.widgets-form.type.description')
    }));

    $typeSelect.change(function (newType) {
      self._widgetDefinitionModel.changeType(this.value);
    });

    var widgetType = this._widgetDefinitionModel.get('type');
    $typeSelect.val(widgetType);
    this.$el.append($typeSelect);

    var formWidgetDataView = new WidgetsDataFormView({
      widgetDefinitionModel: this._widgetDefinitionModel,
      tableModel: this._tableModel
    });
    this.addView(formWidgetDataView);
    this.$el.append(formWidgetDataView.render().el);
  }
});
