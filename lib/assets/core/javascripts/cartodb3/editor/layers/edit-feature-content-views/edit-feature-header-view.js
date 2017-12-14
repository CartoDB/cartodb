var CoreView = require('backbone/core-view');
var template = require('./edit-feature-header.tpl');
var ContextMenuFactory = require('../../../components/context-menu-factory-view');
var ConfirmationView = require('../../../components/modals/confirmation/modal-confirmation-view');
var layerColors = require('../../../data/layer-colors');
var checkAndBuildOpts = require('../../../helpers/required-opts');
var templateConfirmation = require('./delete-feature-confirmation.tpl');

var REQUIRED_OPTS = [
  'url',
  'tableName',
  'modals',
  'isNew',
  'backAction',
  'layerDefinitionModel'
];

module.exports = CoreView.extend({

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
  },

  render: function () {
    this.clearSubViews();

    var featureType = this.model.getFeatureType();
    var letter = this._layerDefinitionModel.get('letter');
    var breadcrumbLabel = this._isNew ? _t('editor.edit-feature.add-' + featureType) : _t('editor.edit-feature.edit', { featureType: featureType });

    this.$el.html(
      template({
        url: this._url,
        layerName: this._layerDefinitionModel.getName(),
        tableName: this._tableName,
        source: this._layerDefinitionModel.getAnalysisDefinitionNodeModel().id,
        bgColor: layerColors.getColorForLetter(letter),
        letter: letter,
        featureType: featureType ? _t('editor.edit-feature.features.' + featureType) : _t('editor.edit-feature.features.geometry'),
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
        this._backAction();
      }.bind(this),
      error: function () {
        this.model.trigger('destroyFeatureFailed');
      }.bind(this)
    });
  }

});
