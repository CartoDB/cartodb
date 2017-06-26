var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var TableStats = require('../../../../components/modals/add-widgets/tablestats');
var Utils = require('../../../../helpers/utils');
require('../../../../components/form-components/index');
var checkAndBuildOpts = require('../../../../helpers/required-opts');

var REQUIRED_OPTS = [
  'configModel',
  'formModel',
  'userModel'
];

var CHECK_FORM_VALIDATION_TOO = {validate: true};

/**
 * This view is required because a schema change require the Backbone.Form object to be re-created to update the view as expected.
 */
module.exports = CoreView.extend({

  module: 'analysis-form-view',

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this.tableStats = new TableStats({
      configModel: this._configModel,
      userModel: this._userModel
    });

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    this._formView = new Backbone.Form({
      model: this._formModel,
      trackingClass: 'track-' + this._formModel.get('type') + '-analysis',
      template: this._formModel.getTemplate(),
      templateData: this._formModel.getTemplateData()
    });

    this._formView.bind('change', this._onChangeAnalysisFormView, this);
    this.$el.append(this._formView.render().el);

    return this;
  },

  _initBinds: function () {
    this.listenTo(this._formModel, 'changeSchema', this.render);
    this.listenTo(this._formModel, 'generateHistogram', this._generateHistogram);
    this.listenTo(this._formModel, 'change:histogram_stats', this._showHistogramStats);
  },

  _onChangeAnalysisFormView: function (data) {
    var formId = this._formView.cid;
    this._formView.model.setFormValidationErrors(undefined);
    var formValue = this._formView.getValue();
    this._formView.model.set(formValue); // <-- This can trigger change events and their callbacks will be run. That could provoke some 'race conditions'.
    this._showAnalysisFormErrors(formId); // To avoid race condition of running this function against a new form view.
  },

  _showAnalysisFormErrors: function (formId) {
    if (this._formView.cid === formId && this._formView.$el) {
      var formValidationErrors = this._formView.commit(CHECK_FORM_VALIDATION_TOO);
      this._formView.model.setFormValidationErrors(formValidationErrors);
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
    if (this._formView) {
      this._formView.remove(); // the Backbone.Form equivalent to "view.clean()"
    }

    return CoreView.prototype.clearSubViews.apply(this, arguments);
  }

});
