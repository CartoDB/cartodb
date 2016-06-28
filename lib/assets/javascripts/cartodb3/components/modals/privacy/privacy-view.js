var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var template = require('./privacy.tpl');
var templateError = require('./privacy-error.tpl');
var PrivacyItemView = require('./privacy-item-view');

/**
 * View to add new widgets.
 * Expected to be rendered in a modal.
 */
module.exports = CoreView.extend({
  className: 'Dialog-content',

  events: {
    'click .js-cancel': '_onCancel',
    'click .js-back': '_onBack',
    'click .js-save': '_onSave'
  },

  initialize: function (opts) {
    if (!opts.modalModel) throw new Error('modalModel is required');
    if (!opts.configModel) throw new TypeError('configModel is required');
    if (!opts.visDefinitionModel) throw new TypeError('visDefinitionModel is required');
    if (!opts.userModel) throw new TypeError('userModel is required');
    if (!opts.privacyCollection) throw new TypeError('privacyCollection is required');

    this._modalModel = opts.modalModel;
    this._visDefinitionModel = opts.visDefinitionModel;
    this._userModel = opts.userModel;
    this._configModel = opts.configModel;

    this._stateModel = new Backbone.Model({
      error: false
    });

    this._privacyCollection = opts.privacyCollection;
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    if (this._hasError()) {
      this._renderError();
    } else {
      this._initViews();
      this._toggleSave();
    }
  },

  _initBinds: function () {
    this._stateModel.on('change:error', this.render, this);
    this._privacyCollection.on('change:selected', this._toggleSave, this);
    this.add_related_model(this._privacyCollection);
    this.add_related_model(this._stateModel);
  },

  _toggleSave: function (m, isSelected) {
    var canSave;
    if (isSelected) {
      canSave = this._privacyCollection.selectedOption().canSave();
      this.$('.js-save').toggleClass('is-disabled', !canSave);
    }
  },

  _hasError: function () {
    return this._stateModel.get('error') === true;
  },

  _initViews: function () {
    var renderItem = this._renderItem.bind(this);

    this.$el.html(template({
      name: this._visDefinitionModel.get('name')
    }));

    this._privacyCollection.each(renderItem);
  },

  _renderItem: function (model) {
    var view = new PrivacyItemView({
      model: model
    });

    this._getList().append(view.render().el);
    this.addView(view);
  },

  _renderError: function () {
    this.$el.html(templateError());
  },

  _getList: function () {
    return this.$('.js-list');
  },

  _onCancel: function () {
    this._modalModel.destroy();
  },

  _onBack: function () {
    this._stateModel.set({
      error: false
    });
  },

  _onSave: function () {
    var self = this;
    this.$('.js-save').addClass('is-disabled');
    this._privacyCollection.selectedOption().saveToVis(this._visDefinitionModel, {
      success: function () {
        self._onCancel();
      },
      error: function () {
        self._stateModel.set({
          error: false
        });
      }
    });
  }
});
