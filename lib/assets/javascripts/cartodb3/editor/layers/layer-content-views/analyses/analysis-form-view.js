var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var TableStats = require('../../../../components/modals/add-widgets/tablestats');
var Utils = require('../../../../helpers/utils');
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
    this._userModel = opts.userModel;
    this._formModel = opts.formModel;

    this.tableStats = new TableStats({
      configModel: this._configModel,
      userModel: this._userModel
    });

    this._formModel.on('changeSchema', this.render, this);
    this._formModel.on('generateHistogram', this._generateHistogram, this);
    this._formModel.on('change:histogram_stats', this._showHistogramStats, this);

    this.add_related_model(this._formModel);
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

  _generateHistogram: function (data) {
    this.tableStats.graphFor(data.tableName, data.columnName, this._drawHistogram.bind(this));
  },

  _showHistogramStats: function () {
    var stats = this._formModel.get('histogram_stats');

    if (!stats || !_.isNumber(stats.max) || !_.isNumber(stats.min)) {
      this.$('.js-histogram').hide();
      return;
    }

    var max = stats.max < 10000 ? Utils.formatNumber(stats.max) : Utils.readizableNumber(stats.max);
    var min = stats.min < 10000 ? Utils.formatNumber(stats.min) : Utils.readizableNumber(stats.min);

    this.$('.js-max').html(max);
    this.$('.js-min').html(min);
    this.$('.js-histogram').show();
  },

  _drawHistogram: function (graph) {
    var stats = this._formModel.get('histogram_stats');

    if (!stats || !_.isNumber(stats.max) || !_.isNumber(stats.min)) {
      return;
    }

    this.$('.js-histogramChart').html(graph.getHistogram({
      color: '#9DE0AD',
      width: 158,
      height: 20,
      bins: 20
    }));

    this._showHistogramStats();
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
