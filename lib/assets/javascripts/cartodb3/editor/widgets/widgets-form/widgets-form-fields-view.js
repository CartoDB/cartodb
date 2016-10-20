var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var WidgetFormFactory = require('./widgets-form-factory');
var template = require('./widgets-form-fields.tpl');
require('../../../components/form-components/index');

/**
 *  View of form to edit a widget definition's data
 *
 */
module.exports = CoreView.extend({

  initialize: function (opts) {
    if (!opts.userActions) throw new Error('userActions is required');
    if (!opts.widgetDefinitionModel) throw new Error('widgetDefinitionModel is required');
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');

    this._userActions = opts.userActions;
    this._widgetDefinitionModel = opts.widgetDefinitionModel;
    this._querySchemaModel = opts.querySchemaModel;

    this._widgetDefinitionModel = opts.widgetDefinitionModel;
    this._widgetFormModel = WidgetFormFactory.createWidgetFormModel(opts.widgetDefinitionModel, this._querySchemaModel);
    this._widgetFormModel.updateSchema();

    this._debounceSaveWidget = _.debounce(this._saveWidget.bind(this), 500);

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this._removeForm();
    this.$el.empty();
    this._initViews();
    return this;
  },

  _initBinds: function () {
    this._widgetFormModel.bind('change:aggregation', this.render, this);
    this._widgetFormModel.bind('change', this._onFormChange, this);
    this.add_related_model(this._widgetFormModel);

    this._widgetDefinitionModel.on('change:title', function (model, title) {
      this._widgetFormModel.set({title: title}, {silent: true}); // silent to avoid sending the form
    }, this);
    this._widgetDefinitionModel.bind('change:auto_style_definition', function (m, changed) {
      var previousAutoStyleDefinition = m.previous('auto_style_definition');
      if (previousAutoStyleDefinition === '' && _.isEmpty(previousAutoStyleDefinition)) {
        this._widgetFormModel.set({
          auto_style_definition: m.get('auto_style_definition')
        }, {
          silent: true
        });
        this.render();
      }
    }, this);
    this.add_related_model(this._widgetDefinitionModel);
  },

  _initViews: function () {
    var model = this._widgetFormModel;
    var fields = model.getFields();

    this._widgetFormView = new Backbone.Form({
      template: template,
      templateData: {
        dataFields: fields.data,
        styleFields: fields.style
      },
      model: model
    });

    this._widgetFormView.bind('change', function () {
      this.commit();
    });

    this.$el.append(this._widgetFormView.render().$el);

    return this;
  },

  _removeForm: function () {
    // Backbone.Form removes the view with the following method
    this._widgetFormView && this._widgetFormView.remove();
  },

  _onFormChange: function () {
    if (this._widgetFormModel.canSave()) {
      this._widgetFormModel.changeWidgetDefinitionModel(this._widgetDefinitionModel);
      this._debounceSaveWidget();
    }
  },

  _saveWidget: function () {
    this._userActions.saveWidget(this._widgetDefinitionModel);
  },

  clean: function () {
    this._removeForm();
    CoreView.prototype.clean.call(this);
  }

});
