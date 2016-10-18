var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var template = require('./edit-feature-controls.tpl');

/**
 * View representing the apply button for a form
 */
module.exports = CoreView.extend({
  className: 'Options-bar Options-bar--right u-flex',

  events: {
    'click .js-save': '_onSaveClicked'
  },

  initialize: function (opts) {
    if (!opts.featureModel) throw new Error('featureModel is required');


    this._featureModel = opts.featureModel;

    // TODO
    this._viewModel = new Backbone.Model({
      isNew: true,
      hasChanges: true
    });

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(template({
      label: this._featureModel.get('persisted')
        ? _t('editor.layers.analysis-form.apply-btn')
        : _t('editor.layers.analysis-form.create-btn'),
      isDisabled: !this._canSave()
    }));
    return this;
  },

  _initBinds: function () {
    this._featureModel.on('change', function () {
      this._viewModel.set('hasChanges', true);
      this.render();
    }, this);
    this.add_related_model(this._featureModel);
  },

  _canSave: function () {
    var isNew = this._viewModel.get('isNew');
    var hasChanges = this._viewModel.get('hasChanges');

    return this._featureModel.isValid() && isNew && hasChanges;
  },

  _onSaveClicked: function () {
    if (this._canSave()) {
      this._saveFeature();
    }
  },

  _saveFeature: function () {
    this._featureModel.fetch();
    this._featureModel.save();

    this._viewModel.set('hasChanges', false);
    this.render();
  }

});
