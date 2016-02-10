var cdb = require('cartodb.js');
var $ = require('jquery');
var FormView = require('./schemas/widgets-form-view');

/**
 * View to render all necessary for the widget form
 */

module.exports = cdb.core.View.extend({

  events: {
    'click .js-back': '_onClickBack'
  },

  initialize: function () {
    if (!this.options.widgetDefinitionModel) {
      throw new Error('A WidgetDefinitionModel should be provided');
    }

    this.widgetDefinitionModel = this.options.widgetDefinitionModel;
    this.widgetDefinitionModel.on('change:type', this.render, this);
  },

  render: function () {
    this.clearSubViews();
    this.$el.html('');
    this._initViews();
    return this;
  },

  _onClickBack: function () {
    this.options.prevStackItem && this.options.prevStackItem('hello');
  },

  _initViews: function () {
    var widgetType = this.widgetDefinitionModel.get('type');
    var self = this;

    this.$el.append($('<button>').addClass('js-back').text('BACK'));

    // TODO: carousel -> Form Widget Type
    var $typeSelect = $('<select><option value="category">category</option><option value="formula">formula</option><option value="category">histogram</option><option value="time-series">time series</option></select>');
    $typeSelect.change(function (newType) {
      self.widgetDefinitionModel.updateType($(this).val());
    });
    $typeSelect.val(widgetType);
    this.$el.append($typeSelect);

    var formWidgetDataView = new FormView({
      type: 'data',
      widgetDefinitionModel: this.widgetDefinitionModel
    });
    this.addView(formWidgetDataView);
    this.$el.append(formWidgetDataView.render().el);

    var formWidgetStyleView = new FormView({
      type: 'style',
      widgetDefinitionModel: this.widgetDefinitionModel
    });
    this.addView(formWidgetStyleView);
    this.$el.append(formWidgetStyleView.render().el);
  }
});
