var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var WidgetFormFactory = require('./widgets-form-factory');
var template = require('./widgets-form-fields.tpl');
require('builder/components/form-components/index');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'userActions',
  'widgetDefinitionModel',
  'querySchemaModel',
  'modals',
  'configModel',
  'userModel'
];

/**
 *  View of form to edit a widget definition's data
 *
 */
module.exports = CoreView.extend({

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
    var widgetOptions = {
      widgetDefinitionModel: this._widgetDefinitionModel,
      querySchemaModel: this._querySchemaModel,
      modals: this._modals,
      userModel: this._userModel,
      configModel: this._configModel
    };

    this._widgetFormModel = WidgetFormFactory.createWidgetFormModel(widgetOptions);
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
    this._widgetFormModel.bind('change:column change:aggregation changeSchema', this.render, this);
    this._widgetFormModel.bind('change', this._onFormChange, this);
    this.add_related_model(this._widgetFormModel);

    this._widgetDefinitionModel.on('change:title', function (model, title) {
      this._widgetFormModel.set({title: title}, {silent: true}); // silent to avoid sending the form
    }, this);
    this._widgetDefinitionModel.bind('change:auto_style_definition', this._onAutoStyleChanged, this);
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

  validateForm: function () {
    return this._widgetFormView.validate();
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

  _onAutoStyleChanged: function (widgetDefModel, changedAttrs) {
    var previousAutoStyleDefinition = widgetDefModel.previous('auto_style_definition');
    if (previousAutoStyleDefinition === '' && _.isEmpty(previousAutoStyleDefinition)) {
      this._widgetFormModel.set({
        auto_style_definition: widgetDefModel.get('auto_style_definition')
      }, {
        silent: true
      });

      if (!_.isEmpty(changedAttrs)) {
        this.render();
      }
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
