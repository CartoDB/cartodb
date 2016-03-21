var Backbone = require('backbone');
var AddAnalysisBodyView = require('./add-analysis-body-view');
var template = require('./add-analysis-view.tpl');

/**
 * View to add new widgets.
 * Expected to be rendered in a modal.
 *
 * The widget options to choose from needs to be calculated from columns derived from the available layers,
 * which may be async, so the actual options can not be created until after the layers' columns are fetched.
 */
module.exports = cdb.core.View.extend({
  className: 'Dialog-content Dialog-content--expanded',

  events: {
    'click .js-add': '_onAddAnalysis'
  },

  initialize: function (opts) {
    if (!opts.modalModel) throw new Error('modalModel is required');
    if (!opts.analysisDefinitionNodeModel) throw new Error('analysisDefinitionNodeModel is required');

    this._modalModel = opts.modalModel;
    this._analysisDefinitionNodeModel = opts.analysisDefinitionNodeModel;

    this._optionsCollection = new Backbone.Collection();

    this.listenTo(this._optionsCollection, 'change:selected', this._onSelectedChange);
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());

    var view = new AddAnalysisBodyView({
      el: this.$('.js-body')
    });
    this.addView(view);
    this._onSelectedChange();

    return this;
  },

  _onAddAnalysis: function () {
    var selectedOptionModel = this._optionsCollection.find(this._isSelected);
    if (selectedOptionModel) {
      this._createNode(selectedOptionModel);
      this._modalModel.destroy();
    }
  },

  _onSelectedChange: function () {
    this.$('.js-add').toggleClass('is-disabled', !this._optionsCollection.any(this._isSelected));
  },

  _isSelected: function (m) {
    return !!m.get('selected');
  },

  _createNode: function (optionModel) {
  }

});
