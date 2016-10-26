var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var template = require('./edit-feature-action.tpl');

/**
 * View representing the apply button for a form
 */
module.exports = CoreView.extend({

  events: {
    'click .js-save': '_onSaveClicked'
  },

  initialize: function (opts) {
    if (!opts.featureModel) throw new Error('featureModel is required');

    this._featureModel = opts.featureModel;

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(template({
      label: this._featureModel.isNew()
        ? 'Add'
        : 'Save',
      isDisabled: !this._canSave()
    }));

    return this;
  },

  _initBinds: function () {
    this.model.on('change', this.render, this);
    this._featureModel.on('change', function () {
      this.model.set('hasChanges', true);
    }, this);
    this.add_related_model(this._featureModel);
  },

  _canSave: function () {
    return this.model.get('hasChanges');
  },

  _onSaveClicked: function () {
    if (this._canSave()) {
      this._saveFeature();
    }
  },

  _saveFeature: function () {
    var self = this;

    this._featureModel.save({
      success: function () {
        self.model.set('hasChanges', false);
      }
    });
  }

});
