var CoreView = require('backbone/core-view');
var template = require('./analysis-controls.tpl');
var AnalysesQuotaFactory = require('./analyses-quota-factory');
var InfoboxView = require('../../../../components/infobox/infobox-view');
var InfoboxFactory = require('../../../../components/infobox/infobox-factory');
var InfoboxModel = require('../../../../components/infobox/infobox-model');
var InfoboxCollection = require('../../../../components/infobox/infobox-collection');

/**
 * View representing the apply button for a form
 */
module.exports = CoreView.extend({
  className: 'Options-bar Options-bar--right u-flex',

  events: {
    'click .js-save': '_onSaveClicked'
  },

  initialize: function (opts) {
    if (!opts.formModel) throw new Error('formModel is required');
    if (!opts.userActions) throw new Error('userActions is required');
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.stackLayoutModel) throw new Error('stackLayoutModel is required');

    this._formModel = opts.formModel;
    this._userActions = opts.userActions;
    this._userModel = opts.userModel;
    this._userFetchModelState = 'idle';
    this._stackLayoutModel = opts.stackLayoutModel;

    this._isNew = !opts.analysisNode;
    this._analysisNode = opts.analysisNode;

    this._formModel.on('change', this.render, this);
    this.add_related_model(this._formModel);

    if (this._analysisNode) {
      this._analysisNode.on('change:status', this.render, this);
      this.add_related_model(this._analysisNode);
    }
  },

  render: function () {
    this.clearSubViews();
    var requiresQuota = AnalysesQuotaFactory.requiresQuota(this._formModel.get('type'), this._userModel);
    var html;

    if (this._canSave() && requiresQuota) {
      html = this._createQuotaView();
    } else {
      html = this._html();
    }

    this.$el.html(html);
    return this;
  },

  _html: function () {
    return template({
      label: this._formModel.get('persisted')
        ? _t('editor.layers.analysis-form.apply-btn')
        : _t('editor.layers.analysis-form.create-btn'),
      isDisabled: !this._canSave()
    });
  },

  _createQuotaView: function () {
    var quotaInfo = AnalysesQuotaFactory.getQuotaInfo(this._formModel.get('type'), this._userModel);
    var creditsLeft = quotaInfo.totalQuota - quotaInfo.usedQuota;
    var canRunAnalysis = creditsLeft > 0 || quotaInfo.hardLimit === false;

    var states = [
      {
        state: 'loading',
        createContentView: function () {
          return InfoboxFactory.createLoading({
            title: _t('editor.layers.analysis-form.quota.title'),
            body: _t('editor.layers.analysis-form.quota.loading')
          });
        }
      },
      {
        state: 'ready',
        createContentView: function () {
          var confirmLabel = this._formModel.get('persisted')
            ? _t('editor.layers.analysis-form.apply-btn')
            : _t('editor.layers.analysis-form.create-btn');

          var quotaMessage = '';
          var blockPrice = (quotaInfo.blockPrice / 100);
          if (creditsLeft > 0) {
            quotaMessage = _t('editor.layers.analysis-form.quota.credits-left-message', { smart_count: creditsLeft });
          } else {
            quotaMessage = _t('editor.layers.analysis-form.quota.no-credits-message');
          }
          quotaInfo.quotaMessage = quotaMessage;

          return InfoboxFactory.createQuota({
            type: 'alert',
            title: _t('editor.layers.analysis-form.quota.title'),
            body: creditsLeft > 0
              ? _t('editor.layers.analysis-form.quota.credits-left-body', {
                blockSize: quotaInfo.blockSize,
                blockPrice: blockPrice
              })
              : _t('editor.layers.analysis-form.quota.no-credits-body', {
                blockSize: quotaInfo.blockSize,
                blockPrice: blockPrice
              }),
            confirmLabel: confirmLabel,
            confirmType: 'button',
            confirmDisabled: !this._canSave() || !canRunAnalysis,
            cancelLabel: _t('editor.layers.analysis-form.quota.cancel'),
            cancelType: 'link',
            quota: quotaInfo
          });
        }.bind(this),
        mainAction: function () {
          this._stackLayoutModel.prevStep('layers');
        }.bind(this),
        secondAction: function () {
          if (this._canSave() && canRunAnalysis) {
            this._userActions.saveAnalysis(this._formModel);
          }
        }.bind(this)
      },
      {
        state: 'error',
        createContentView: function () {
          return InfoboxFactory.createConfirm({
            title: _t('editor.layers.analysis-form.quota.title'),
            type: 'error',
            body: _t('editor.layers.analysis-form.quota.title'),
            cancelLabel: _t('editor.layers.analysis-form.quota.cancel')
          });
        },
        mainAction: function () {
          this._stackLayoutModel.prevStep('layers');
        }.bind(this)
      }
    ];

    this._infoboxModel = new InfoboxModel({
      state: this._userFetchModelState,
      visible: true
    });

    if (this._userFetchModelState === 'idle') {
      this._userFetchModelState = 'loading';

      this._userModel.fetch({
        success: function () {
          this._userFetchModelState = 'ready';
          this._infoboxModel.set('state', this._userFetchModelState);
        }.bind(this),
        error: function () {
          this._userFetchModelState = 'error';
          this._infoboxModel.set('state', this._userFetchModelState);
        }.bind(this)
      });
    }

    this.view = new InfoboxView({
      className: 'Infobox-wrapper',
      infoboxModel: this._infoboxModel,
      infoboxCollection: new InfoboxCollection(states)
    });

    this.addView(this.view);
    return this.view.render().el;
  },

  _canSave: function () {
    var isAnalysisDone = this._analysisNode && this._analysisNode.isDone() || false;
    var isDone = this._isNew || isAnalysisDone;
    return this._formModel.isValid() && isDone;
  },

  _onSaveClicked: function () {
    if (this._canSave()) {
      this._userActions.saveAnalysis(this._formModel);
    }
  }

});
