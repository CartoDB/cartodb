var CoreView = require('backbone/core-view');
var template = require('./edit-feature-action.tpl');

/**
 * View representing the apply button for a form
 */
module.exports = CoreView.extend({

  events: {
    'click .js-save': '_saveFeature'
  },

  initialize: function (opts) {
    if (!opts.featureModel) throw new Error('featureModel is required');

    this._featureModel = opts.featureModel;

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(template({
      label: this._featureModel.isNew() ? _t('editor.edit-feature.add') : _t('editor.edit-feature.save'),
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

    var ev = (this._featureModel.isNew() ? 'add' : 'save') + 'Feature';
    this._featureModel.trigger(ev);

    this._featureModel.save({
      success: function () {
        self._featureModel.trigger('saveFeatureSuccess');
        self.model.set('hasChanges', false);
      },
      error: function () {
        self._featureModel.trigger('saveFeatureFailed');
      }
    });
  }

});
