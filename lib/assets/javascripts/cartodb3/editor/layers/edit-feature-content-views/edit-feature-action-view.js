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
    if (!opts.geometryFormModel) throw new Error('geometryFormModel is required');
    if (!opts.attributesFormModel) throw new Error('attributesFormModel is required');

    this._featureModel = opts.featureModel;
    this._geometryFormModel = opts.geometryFormModel;
    this._attributesFormModel = opts.attributesFormModel;

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
    this._geometryFormModel.bind('validate', function (isValid) {
      this.model.set('isValidGeometry', !isValid);
    }, this);
    this.add_related_model(this._geometryFormModel);
    this._attributesFormModel.bind('validate', function (isValid) {
      this.model.set('isValidAttributes', !isValid);
    }, this);
    this.add_related_model(this._attributesFormModel);
  },

  _canSave: function () {
    var hasChanges = this.model.get('hasChanges');
    var isValidGeometry = this.model.get('isValidGeometry');
    var isValidAttributes = this.model.get('isValidAttributes');

    return isValidGeometry && isValidAttributes && hasChanges;
  },

  _onSaveClicked: function () {
    if (this._canSave()) {
      this._saveFeature();
    }
  },

  _saveFeature: function () {
    var self = this;

    var operation = this._featureModel.isNew() ? 'add' : 'save';
    var event = operation + 'Feature';
    this._featureModel.trigger(event);

    this._featureModel.save({
      success: function () {
        self._featureModel.trigger('saveFeatureSuccess', operation, self._featureModel);
        self.model.set('hasChanges', false);
      },
      error: function () {
        self._featureModel.trigger('saveFeatureFailed');
      }
    });
  }

});
