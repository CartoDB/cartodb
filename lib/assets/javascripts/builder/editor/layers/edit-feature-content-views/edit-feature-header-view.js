var CoreView = require('backbone/core-view');
var template = require('./edit-feature-header.tpl');
var ContextMenuFactory = require('builder/components/context-menu-factory-view');
var ConfirmationView = require('builder/components/modals/confirmation/modal-confirmation-view');
var checkAndBuildOpts = require('builder/helpers/required-opts');
var templateConfirmation = require('./delete-feature-confirmation.tpl');

var REQUIRED_OPTS = [
  'url',
  'tableName',
  'modals',
  'isNew',
  'layerDefinitionModel'
];

module.exports = CoreView.extend({

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
  },

  render: function () {
    this.clearSubViews();

    var letter = this._layerDefinitionModel.get('letter');
    var featureType = this.model.getFeatureType() ? _t('editor.edit-feature.features.' + this.model.getFeatureType()) : _t('editor.edit-feature.features.geometry');
    var breadcrumbLabel = this._isNew ? _t('editor.edit-feature.add-' + featureType) : _t('editor.edit-feature.edit', { featureType: featureType });

    this.$el.html(
      template({
        url: this._url,
        layerName: this._layerDefinitionModel.getName(),
        tableName: this._tableName,
        bgColor: this._layerDefinitionModel.getColor(),
        letter: letter,
        featureType: featureType,
        breadcrumbLabel: breadcrumbLabel
      })
    );

    if (!this._isNew) {
      this._initViews();
    }

    return this;
  },

  _initViews: function () {
    var menuItems = [{
      label: _t('editor.edit-feature.delete', { featureType: _t('editor.edit-feature.features.' + this.model.getFeatureType()) }),
      val: 'delete-feature',
      destructive: true,
      action: this._confirmDeleteFeature.bind(this)
    }];

    this._contextMenuFactory = new ContextMenuFactory({
      menuItems: menuItems
    });

    this.$('.js-context-menu').append(this._contextMenuFactory.render().el);
    this.addView(this._contextMenuFactory);
  },

  _confirmDeleteFeature: function () {
    this._modals.create(function (modalModel) {
      return new ConfirmationView({
        modalModel: modalModel,
        template: templateConfirmation,
        runAction: this._destroyFeature.bind(this)
      });
    }.bind(this));
  },

  _destroyFeature: function () {
    this.model.trigger('destroyFeature');

    this.model.destroy({
      success: function () {
        this.model.trigger('destroyFeatureSuccess');
      }.bind(this),
      error: function () {
        this.model.trigger('destroyFeatureFailed');
      }.bind(this)
    });
  }

});
