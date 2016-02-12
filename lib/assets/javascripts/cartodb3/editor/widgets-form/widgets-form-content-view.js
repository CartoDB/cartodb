var cdb = require('cartodb.js');
var $ = require('jquery');
var WidgetsDataFormView = require('./widgets-form-data-view');
var WidgetFormFactory = require('./widgets-form-factory');
var WidgetsStyleFormView = require('./widgets-form-style-view');
var typesTemplate = require('./types.tpl');

/**
 * View to render all necessary for the widget form
 */

module.exports = cdb.core.View.extend({

  events: {
    'click .js-back': '_onClickBack'
  },

  initialize: function (opts) {
    if (!opts.tableModel) throw new Error('tableModel is required');
    if (!opts.widgetDefinitionModel) throw new Error('widgetDefinitionModel is required');
    this._tableModel = opts.tableModel;
    this._widgetDefinitionModel = opts.widgetDefinitionModel;

    this._widgetDefinitionModel.on('change:type', this.render, this);

    if (!this._tableModel.get('fetched')) {
      this._tableModel.fetch({
        success: this.render.bind(this)
      });
    }
  },

  render: function () {
    this.clearSubViews();
    this.$el.html('');
    this._initViews();
    return this;
  },

  _onClickBack: function () {
    this.options.prevStackItem && this.options.prevStackItem();
  },

  _initViews: function () {
    var self = this;

    this.$el.append(
      $('<button>')
        .addClass('js-back')
        .html('<i class="CDB-IconFont CDB-IconFont-arrowPrev"></i>')
      );

    // TODO: carousel -> Form Widget Type
    var types = WidgetFormFactory.getDataTypes(this._tableModel);

    var $typeSelect = $(typesTemplate({ types: types }));
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

    var formWidgetStyleView = new WidgetsStyleFormView({
      widgetDefinitionModel: this._widgetDefinitionModel
    });
    this.addView(formWidgetStyleView);
    this.$el.append(formWidgetStyleView.render().el);
  }
});
