var _ = require('underscore');
var cdb = require('cartodb.js');
var WidgetFormFactory = require('./widgets-form-factory');
var Backbone = require('backbone');
var Template = require('./widgets-form-data.tpl');
require('../../../components/form-components/index');

/**
 *  View of form to edit a widget definition's data
 *
 */
module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.widgetDefinitionModel) throw new Error('widgetDefinitionModel is required');
    if (!opts.layerTableModel) throw new Error('layerTableModel is required');

    this._widgetDefinitionModel = opts.widgetDefinitionModel;
    this._layerTableModel = opts.layerTableModel;

    this._widgetFormModel = WidgetFormFactory.createWidgetFormDataModel(opts.widgetDefinitionModel, this._layerTableModel);
    this._widgetFormModel.updateSchema();
    this._widgetFormModel.bind('change', _.debounce(this._onFormChange.bind(this), 500));
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this.$el.html(Template({
      title: _t('editor.widgets.widgets-form.data.title-label'),
      description: _t('editor.widgets.widgets-form.data.description')
    }));
    this._initViews();
    return this;
  },

  _initViews: function () {
    if (this._widgetFormView) {
      this._widgetFormView.remove();
    }

    this._widgetFormView = new Backbone.Form({
      model: this._widgetFormModel
    });

    this._widgetFormView.bind('change', function () {
      this.commit();
    });

    this.$('.js-content').html(this._widgetFormView.render().$el);

    return this;
  },

  clean: function () {
    // Backbone.Form removes the view with the following method
    this._widgetFormView.remove();
    cdb.core.View.prototype.clean.call(this);
  },

  _onFormChange: function () {
    if (this._widgetFormModel.canSave()) {
      this._widgetDefinitionModel.save(this._widgetFormModel.attributes, { wait: true });
    }
  }

});
