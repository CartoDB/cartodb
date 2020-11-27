var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var template = require('./source-layer-analysis-view.tpl');
var TipsyTooltipView = require('builder/components/tipsy-tooltip-view');
var moment = require('moment');

/**
 * View for a analysis source (i.e. SQL query).
 *
 * this.model is expected to be a analysis-definition-node-model and belong to the given layer-definition-model
 */
module.exports = CoreView.extend({

  tagName: 'li',
  className: 'Editor-ListAnalysis-item Editor-ListAnalysis-layer js-base is-base u-flex u-justifySpace',

  events: {
    'mouseenter': '_onMouseEnter',
    'mouseleave': '_onMouseLeave'
  },

  initialize: function (opts) {
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.analysisNode) throw new Error('analysisNode is required');

    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._analysisNode = opts.analysisNode;
    this._tableNodeModel = this._analysisNode.getTableModel();
    this._stateModel = new Backbone.Model({
      highlighted: false
    });

    this._initBinds();
  },

  options: {
    showId: true
  },

  render: function () {
    this.clearSubViews();

    var isSync = this._tableNodeModel && this._tableNodeModel.isSync();
    var syncData = {};

    if (isSync) {
      var syncModel = this._tableNodeModel.getSyncModel();
      var runAt = syncModel.get('run_at');
      var ranAt = syncModel.get('ran_at');
      var modifiedAt = syncModel.get('modified_at');

      syncData = {
        ranAt: moment(ranAt || new Date()).fromNow(),
        runAt: moment(runAt).fromNow(),
        modifiedAt: modifiedAt && moment(modifiedAt).fromNow(),
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

    var isCustomQueryApplied = this._analysisNode.isCustomQueryApplied();
    this.$el.html(template(_.extend({
      id: this.options.showId ? this.model.id : '',
      tableName: this.model.get('table_name'),
      customQueryApplied: isCustomQueryApplied,
      isSync: isSync,
      bgColor: this._analysisNode.getColor()
    }, syncData)));

    var sourceTooltip = new TipsyTooltipView({
      el: this.$el,
      gravity: 'w',
      title: function () {
        return _t('data-source');
      }
    });
    this.addView(sourceTooltip);

    if (isSync) {
      var syncTooltipTitle = (syncData.errorCode || syncData.errorMessage) ? _t('dataset.sync.error-code', { errorCode: syncData.errorCode }) + ':' + syncData.errorMessage : $(this).data('tooltip');
      var syncTooltip = new TipsyTooltipView({
        el: this.$('.js-sync'),
        gravity: 's',
        offset: 0,
        title: syncTooltipTitle
      });
      this.addView(syncTooltip);
    }

    if (isCustomQueryApplied) {
      var sqlTooltip = new TipsyTooltipView({
        el: this.$('.js-sql'),
        gravity: 'w',
        title: function () {
          return _t('sql-applied');
        },
        mouseEnterAction: function () {
          sourceTooltip.hideTipsy();
        },
        mouseLeaveAction: function () {
          sourceTooltip.showTipsy();
        }
      });
      this.addView(sqlTooltip);
    }

    return this;
  },

  _initBinds: function () {
    this.listenTo(this._stateModel, 'change:highlighted', this._toggleHover);
    this.listenTo(this._tableNodeModel, 'change:synchronization', this.render);
  },

  _onMouseEnter: function () {
    this._stateModel.set('highlighted', true);
  },

  _onMouseLeave: function () {
    this._stateModel.set('highlighted', false);
  },

  _toggleHover: function () {
    var $layer = this.$el.closest('.js-layer');
    var $title = $layer.find('.js-Editor-ListLayer-titleText');
    var highlighted = this._stateModel.get('highlighted');

    $layer.toggleClass('is-hover', highlighted);
    $title.toggleClass('is-hover', highlighted);
  }
});
