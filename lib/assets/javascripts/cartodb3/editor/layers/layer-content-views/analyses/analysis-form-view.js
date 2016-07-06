var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var TableStats = require('../../../../components/modals/add-widgets/tablestats');
require('../../../../components/form-components/index');

var CHECK_FORM_VALIDATION_TOO = {validate: true};

/**
 * This view is required because a schema change require the Backbone.Form object to be re-created to update the view as expected.
 */
module.exports = CoreView.extend({

  initialize: function (opts) {
    if (!opts.formModel) throw new Error('formModel is required');
    if (!opts.configModel) throw new Error('configModel is required');

    this._configModel = opts.configModel;
    this._formModel = opts.formModel;

    this.tableStats = new TableStats({
      configModel: this._configModel
    });

    this._formModel.on('changeSchema', this.render, this);
    this._formModel.on('generateHistogram', this._generateHistogram, this);
    this._formModel.on('changeHistogramStats', this._onColData, this);

    this.add_related_model(this._formModel);
  },

  _onColData: function () {
    this.$('.js-max').html(this._formModel.get('min'));
    this.$('.js-min').html(this._formModel.get('max'));
  },

  _generateHistogram: function (data) {
    var self = this;

    this.tableStats.graphFor(data.tableName, data.columnName, function (graph) {
      if (graph.stats) {
        self.$('.js-Histogram').html(graph.getHistogram({
          color: '#9DE0AD',
          width: 158,
          height: 20,
          bins: 20
        }));
      }
    });
  },

  render: function () {
    this.clearSubViews();

    this._analysisFormView = new Backbone.Form({
      model: this._formModel,
      template: this._formModel.getTemplate(),
      templateData: this._formModel.getTemplateData()
    });

    this._analysisFormView.bind('change', this._onChangeAnalysisFormView, this);
    this.$el.append(this._analysisFormView.render().el);

    return this;
  },

  _onChangeAnalysisFormView: function () {
    this._analysisFormView.model.setFormValidationErrors(undefined);
    this._analysisFormView.model.set(this._analysisFormView.getValue());
    this._showAnalysisFormErrors();
  },

  _showAnalysisFormErrors: function () {
    if (this._analysisFormView.$el) {
      var formValidationErrors = this._analysisFormView.commit(CHECK_FORM_VALIDATION_TOO);
      this._analysisFormView.model.setFormValidationErrors(formValidationErrors);
    }
  },

  /**
   * @override CoreView.prototype.clearSubViews
   */
  clearSubViews: function () {
    if (this._analysisFormView) {
      this._analysisFormView.remove(); // the Backbone.Form equivalent to "view.clean()"
    }

    return CoreView.prototype.clearSubViews.apply(this, arguments);
  }

});
