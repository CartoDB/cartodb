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
    if (!opts.row) throw new Error('row is required');
    if (!opts.columnsCollection) throw new Error('columnsCollection is required');


    this._featureModel = opts.featureModel;
    this._row = opts.row;
    this._columnsCollection = opts.columnsCollection;

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
    var columns = _.map(this._columnsCollection.models, function(mdl) {
      return mdl.get('name');
    });
    var attrs = _.pick(this._featureModel.toJSON(), _.without(columns, 'cartodb_id', 'created_at', 'the_geom_webmercator', 'updated_at'));

    this._row.set(attrs);
    this._row.save();

    this._viewModel.set('hasChanges', false);
    this.render();
  }

});
