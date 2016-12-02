var CoreView = require('backbone/core-view');
var template = require('./source-layer-analysis-view.tpl');
var SQLUtils = require('../../../helpers/sql-utils');
var TipsyTooltipView = require('../../../components/tipsy-tooltip-view');
var moment = require('moment');
var $ = require('jquery');
var _ = require('underscore');

/**
 * View for a analysis source (i.e. SQL query).
 *
 * this.model is expected to be a analysis-definition-node-model and belong to the given layer-definition-model
 */
module.exports = CoreView.extend({

  tagName: 'li',
  className: 'Editor-ListAnalysis-item Editor-ListAnalysis-layer is-base',

  initialize: function (opts) {
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.analysisNode) throw new Error('analysisNode is required');

    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._analysisNode = opts.analysisNode;

    this._tableNodeModel = this._analysisNode.getTableModel();

    this._initBinds();
  },

  options: {
    showId: true
  },

  render: function () {
    var originalQuery = SQLUtils.getDefaultSQLFromTableName(this._layerDefinitionModel.getQualifiedTableName());
    var query = this.model.get('query');

    var isSync = this._tableNodeModel && this._tableNodeModel.isSync();
    var syncData = {};

    if (isSync) {
      var syncModel = this._tableNodeModel.getSyncModel();
      var runAt = syncModel.get('run_at');

      syncData = {
        ranAt: moment(syncModel.get('ran_at') || new Date()).fromNow(),
        runAt: moment(runAt).fromNow(),
        state: syncModel.get('state'),
        errorCode: syncModel.get('error_code'),
        errorMessage: syncModel.get('error_message')
      };

      // Due to the time we need to polling, we have to display to the user
      // that the sync will be in a moment
      if (!runAt || (new Date(runAt) <= new Date())) {
        syncData.runAt = _t('dataset.sync.in-a-moment');
      }
    }

    // As we don't know if the user is in an org or not, we check both versions of the query
    var isCustomQueryApplied = !SQLUtils.isSameQuery(originalQuery, query);
    this.$el.html(template(_.extend({
      id: this.options.showId
        ? this.model.id
        : '',
      tableName: this.model.get('table_name'),
      customQueryApplied: isCustomQueryApplied,
      isSync: isSync
    }, syncData)));

    if (isSync) {
      var tooltip = new TipsyTooltipView({
        el: this.$('.js-sync'),
        gravity: 's',
        offset: 0,
        title: function () {
          return (syncData.errorCode || syncData.errorMessage) ? _t('dataset.sync.error-code', { errorCode: syncData.errorCode }) + ':' + syncData.errorMessage : $(this).data('tooltip');
        }
      });
      this.addView(tooltip);
    }

    return this;
  },

  _initBinds: function () {
    this._tableNodeModel.on('change:synchronization', this.render, this);
    this.add_related_model(this._tableNodeModel);
  }

});
