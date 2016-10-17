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
    if (!opts.userActions) throw new Error('userActions is required');
    if (!opts.stackLayoutModel) throw new Error('stackLayoutModel is required');

    this._featureModel = opts.featureModel;
    this._userActions = opts.userActions;
    this._stackLayoutModel = opts.stackLayoutModel;

    this._viewModel = new Backbone.Model({
      userFetchModelState: 'idle',
      isNewFeature: !opts.featureModel,
      hasChanges: !opts.featureModel
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
    // var isDone = this._viewModel.get('isNewAnalysis') || isAnalysisDone;
    var isDone = true;
    var hasChanges = this._viewModel.get('hasChanges');
    return this._featureModel.isValid() && isDone && hasChanges;
  },

  _onSaveClicked: function () {
    if (this._canSave()) {
      this._saveFeature();
    }
  },

  _saveFeature: function () {
    this._userActions.saveFeature(this._featureModel);
    this._viewModel.set('hasChanges', false);
    this.render();
  }

});
