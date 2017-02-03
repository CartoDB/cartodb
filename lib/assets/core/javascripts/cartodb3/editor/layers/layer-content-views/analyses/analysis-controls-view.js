var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var template = require('./analysis-controls.tpl');
var AnalysesQuotaFactory = require('./analyses-quota-factory');
var InfoboxView = require('../../../../components/infobox/infobox-view');
var InfoboxFactory = require('../../../../components/infobox/infobox-factory');
var InfoboxModel = require('../../../../components/infobox/infobox-model');
var InfoboxCollection = require('../../../../components/infobox/infobox-collection');

var CONTACT_LINK_TEMPLATE = _.template("<a href='mailto:<%- mail %>'><%- contact %></a>");

var AnalysesQuotaOptions = require('./analyses-quota-options');
var AnalysesQuotaProvider = require('./analyses-quota-provider');
var AnalysesQuotaEstimation = require('./analyses-quota-estimation-input');
var AnalysesQuotaEnough = require('./analyses-quota-enough');

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
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.querySchemaModel) throw new Error('querySchemaModel is required');
    if (!opts.quotaInfo) throw new Error('quotaInfo is required');

    console.log('foo');

    this._formModel = opts.formModel;
    this._userActions = opts.userActions;
    this._userModel = opts.userModel;
    this._configModel = opts.configModel;
    this._stackLayoutModel = opts.stackLayoutModel;
    this._analysisNode = opts.analysisNode;
    this._quotaInfo = opts.quotaInfo;
    this._querySchemaModel = opts.querySchemaModel;

    this._viewModel = new Backbone.Model({
      userFetchModelState: 'fetching',
      isNewAnalysis: !opts.analysisNode,
      hasChanges: !opts.analysisNode
    });

    this._infoboxModel = new InfoboxModel({
      state: this._viewModel.get('userFetchModelState'),
      visible: true
    });

    this._initBinds();

    this._quotaInfo.fetch({
      success: function () {
        this._viewModel.set({userFetchModelState: 'fetched'});
        this._infoboxModel.set('state', 'ready');
      }.bind(this),
      error: function () {
        this._viewModel.set({userFetchModelState: 'error'});
        this._infoboxModel.set('state', 'error');
      }.bind(this)
    });
  },

  render: function () {
    this.clearSubViews();
    var type = this._formModel.get('type');
    var fetchingState = this._viewModel.get('userFetchModelState');
    var requiresQuota;
    var html;

    if (fetchingState === 'fetching') {
      console.log('loading');
      // html = this._createQuotaView();
    } else if (fetchingState === 'fetched') {
      requiresQuota = AnalysesQuotaOptions.requiresQuota(type, this._quotaInfo);
      if (this._canSave() && requiresQuota) {
        html = this._createQuotaView();
      } else {
        html = this._html();
      }
    } else if (fetchingState === 'error') {
      console.log('error');
    }

    // var newRequiresQuota = AnalysesQuotaOptions.requiresQuota(type, this._quotaInfo);

    // var requiresQuota = AnalysesQuotaFactory.requiresQuota(type, this._userModel);
    // console.log(newRequiresQuota, requiresQuota);

    // var html;

    // if (this._canSave() && requiresQuota || !this._hasQuotaInfo()) {
    //   html = this._createQuotaView();
    // } else {
    //   html = this._html();
    // }

    this.$el.html(html);
    return this;
  },

  _initBinds: function () {
    this._formModel.on('change', function () {
      this._viewModel.set('hasChanges', true);
      this.render();
    }, this);
    this.add_related_model(this._formModel);

    this._viewModel.on('change:userFetchModelState', function (model, userFetchModelState) {
      console.log(model, userFetchModelState);
      this.render();
    }, this);
    this.add_related_model(this._viewModel);

    if (this._analysisNode) {
      this._analysisNode.on('change:status', this.render, this);
      this.add_related_model(this._analysisNode);
    }
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
    var formModel = this._formModel;
    var infoboxModel = this._infoboxModel;
    var type = formModel.get('type');
    var configModel = this._configModel;
    var userModel = this._configModel;
    var query = this._querySchemaModel.get('query');
    var service = AnalysesQuotaOptions.getServiceName(type);
    var quotaData = this._quotaInfo;
    var quotaInfo;
    var creditsLeft;
    var canRunAnalysis;

    console.log(service);

    infoboxModel.set('state', 'fetching');

    var errorCallback = function (error) {
      console.log(error);
      infoboxModel.set('state', 'error');
    };

    AnalysesQuotaEstimation(configModel, query)
      .then(function (data) {
        // Apply transformation to the input
        // for example isolines takes tracts in in order to calculate estimation
        var rows = AnalysesQuotaOptions.transformInput(type, data, formModel);
        console.log(data, rows);

        // with the input, we calculate wether the quota is enough
        return AnalysesQuotaEnough(configModel, service, rows);
      }, errorCallback)
      .then(function (enoughQuota) {
        // then we can get the full set of data
        quotaInfo = AnalysesQuotaProvider(type, userModel, quotaData, enoughQuota);
        creditsLeft = quotaInfo.totalQuota - quotaInfo.usedQuota;
        canRunAnalysis = creditsLeft > 0 || quotaInfo.hardLimit === false;

        console.log(quotaInfo);
        infoboxModel.set('state', 'ready');
      }, errorCallback);

    // var quotaInfo = AnalysesQuotaFactory.getQuotaInfo(type, this._userModel);
    // var creditsLeft = quotaInfo.totalQuota - quotaInfo.usedQuota;
    // var canRunAnalysis = creditsLeft > 0 || quotaInfo.hardLimit === false;

    var states = [
      {
        state: 'fetching',
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

          var getNoCreditMessage = function (quota) {
            var link;
            var message;
            if (quota.totalQuota === 0) {
              link = CONTACT_LINK_TEMPLATE({
                mail: _t('editor.layers.analysis-form.quota.no-credits-mail'),
                contact: _t('editor.layers.analysis-form.quota.no-quota-assigned-contact')
              });
              message = _t('editor.layers.analysis-form.quota.no-quota-assigned-body', {
                analysis: AnalysesQuotaFactory.getAnalysisName(type),
                contact: link
              });
            } else {
              link = CONTACT_LINK_TEMPLATE({
                mail: _t('editor.layers.analysis-form.quota.no-credits-mail'),
                contact: _t('editor.layers.analysis-form.quota.no-credits-contact')
              });
              message = _t('editor.layers.analysis-form.quota.no-credits-body', {
                contact: link
              });
            }

            return message;
          };

          return InfoboxFactory.createQuota({
            type: 'alert',
            title: _t('editor.layers.analysis-form.quota.title'),
            body: creditsLeft > 0
              ? _t('editor.layers.analysis-form.quota.credits-left-body', {
                blockSize: quotaInfo.blockSize,
                blockPrice: blockPrice
              })
              : getNoCreditMessage(quotaInfo),
            confirmLabel: confirmLabel,
            confirmType: 'primary',
            confirmDisabled: !this._canSave() || !canRunAnalysis,
            confirmPosition: 'right',
            cancelLabel: _t('editor.layers.analysis-form.quota.cancel'),
            cancelType: 'link',
            cancelPosition: 'left',
            quota: quotaInfo
          });
        }.bind(this),
        mainAction: function () {
          if (this._canSave() && canRunAnalysis) {
            this._saveAnalysis();
          }
        }.bind(this),
        secondAction: function () {
          this._stackLayoutModel.prevStep('layers');
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

    // if (this._viewModel.get('userFetchModelState') === 'idle') {
    //   this._viewModel.set('userFetchModelState', 'loading');

    //   this._userModel.fetch({
    //     success: function () {
    //       this._viewModel.set('userFetchModelState', 'ready');
    //       this._infoboxModel.set('state', 'ready');
    //     }.bind(this),
    //     error: function () {
    //       this._viewModel.set('userFetchModelState', 'error');
    //       this._infoboxModel.set('state', 'error');
    //     }.bind(this)
    //   });
    // }

    this.view = new InfoboxView({
      className: 'Infobox-wrapper',
      infoboxModel: this._infoboxModel,
      infoboxCollection: new InfoboxCollection(states)
    });

    this.addView(this.view);
    return this.view.render().el;
  },

  _canSave: function () {
    var isAnalysisDone = this._analysisNode && (this._analysisNode.isDone() || this._analysisNode.hasFailed());
    var isDone = this._viewModel.get('isNewAnalysis') || isAnalysisDone;
    var hasChanges = this._viewModel.get('hasChanges');
    return this._formModel.isValid() && isDone && hasChanges;
  },

  _onSaveClicked: function () {
    if (this._canSave()) {
      this._saveAnalysis();
    }
  },

  _saveAnalysis: function () {
    this._userActions.saveAnalysis(this._formModel);
    this._viewModel.set('hasChanges', false);
    this.render();
  }
});
