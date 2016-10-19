var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var template = require('./edit-feature-controls.tpl');

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
    this._featureModel.on('change', function () {
      this.model.set('hasChanges', true);
    }, this);
    this.add_related_model(this._featureModel);
  },

  _canSave: function () {
    var isValid = this._featureModel.isValid();
    var hasChanges = this.model.get('hasChanges');

    return isValid && hasChanges;
  },

  _onSaveClicked: function () {
    if (this._canSave()) {
      this._saveFeature();
    }
  },

  _saveFeature: function () {
    this._featureModel.save();

    this.model.set('hasChanges', false);
  }

});
