var CoreView = require('backbone/core-view');
var template = require('./edit-feature-header.tpl');
var ContextMenuFactory = require('../../../components/context-menu-factory-view');
var ConfirmationView = require('../../../components/modals/confirmation/modal-confirmation-view');
var templateConfirmation = require('./delete-feature-confirmation.tpl');

module.exports = CoreView.extend({

  initialize: function (opts) {
    if (!opts.url) throw new Error('url is required');
    if (!opts.tableName) throw new Error('tableName is required');
    if (!opts.modals) throw new Error('modals is required');
    if (opts.isNew === undefined) throw new Error('isNew is required');
    if (!opts.backAction) throw new Error('backAction is required');

    this._url = opts.url;
    this._tableName = opts.tableName;
    this._modals = opts.modals;
    this._isNew = opts.isNew;
    this._backAction = opts.backAction;
  },

  render: function () {
    this.clearSubViews();

    var featureType = this.model.getFeatureType();

    this.$el.html(
      template({
        url: this._url,
        tableName: this._tableName,
        featureType: featureType ? _t('editor.edit-feature.features.' + featureType) : _t('editor.edit-feature.features.geometry')
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
    var self = this;

    this._modals.create(function (modalModel) {
      return new ConfirmationView({
        modalModel: modalModel,
        template: templateConfirmation,
        runAction: self._destroyFeature.bind(self)
      });
    });
  },

  _destroyFeature: function () {
    var self = this;

    this.model.trigger('destroyFeature');

    this.model.destroy({
      success: function () {
        self.model.trigger('destroyFeatureSuccess');
        self._backAction();
      },
      error: function () {
        self.model.trigger('destroyFeatureFailed');
      }
    });
  }

});
