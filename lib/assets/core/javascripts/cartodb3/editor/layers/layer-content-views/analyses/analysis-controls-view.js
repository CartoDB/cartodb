var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var template = require('./analysis-controls.tpl');
var InfoboxFactory = require('../../../../components/infobox/infobox-factory');
var InfoboxModel = require('../../../../components/infobox/infobox-model');
var InfoboxCollection = require('../../../../components/infobox/infobox-collection');
var AnalysesQuotaPresenter = require('./analyses-quota/analyses-quota-presenter');
var AnalysesQuotaOptions = require('./analyses-quota/analyses-quota-options');
var AnalysesQuotaProvider = require('./analyses-quota/analyses-quota-provider');
var AnalysesQuotaEstimation = require('./analyses-quota/analyses-quota-estimation-input');
var AnalysesQuotaEnough = require('./analyses-quota/analyses-quota-enough');
var checkAndBuildOpts = require('../../../../helpers/required-opts');
var AnalysisButtonView = require('./analysis-button-view');
var AnalysisQuotaView = require('./analysis-quota-view');

var REQUIRED_OPTS = [
  'formModel',
  'userActions',
  'userModel',
  'stackLayoutModel',
  'configModel',
  'querySchemaModel',
  'quotaInfo'
];

/**
 * View representing the apply button for a form
 */
module.exports = CoreView.extend({
  className: 'Options-bar Options-bar--right u-flex',

  events: {
    'click .js-save': '_onSaveClicked'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
    this._analysisNode = opts.analysisNode;

    AnalysesQuotaEstimation.init(opts.configModel);
    AnalysesQuotaEnough.init(opts.configModel);

    this._viewModel = new Backbone.Model({
      isNewAnalysis: !opts.analysisNode,
      hasChanges: !opts.analysisNode,
      type: this._formModel.get('type')
    });

    this._infoboxModel = new InfoboxModel({
      state: this._quotaInfo.getState(),
      visible: true
    });

    this._initBinds();

    if (!opts.analysisNode) {
      this._fetchQuotaIfNeeded();
    }

    this.render = this.render.bind(this);
    this._onFormModelChanged = this._onFormModelChanged.bind(this);
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    var type = this._formModel.get('type');
    var isValid = this._formModel.isValid();

    // If no dataservice, requiresQuota returns false because the model doesn't exist and it's converted to boolean
    var requiresQuota = AnalysesQuotaOptions.requiresQuota(type, this._quotaInfo);
    var view;

    if (this._isAnalysisDone() && !this._hasChanges()) {
      view = this._createButtonView();
    } else {
      // If the analysis doesn't require quota, let's not wait or check the fetching state
      if (!requiresQuota || !isValid) {
        view = this._createButtonView();
      } else {
        view = this._createQuotaView();
      }
    }

    this.addView(view);
    this.$el.append(view.render().el);
    return this;
  },

  _initBinds: function () {
    this.listenTo(this._formModel, 'change', this._onFormModelChanged);

    if (this._analysisNode) {
      this.listenTo(this._analysisNode, 'change:status', function () {
        var isAnalysisDone = this._isAnalysisDone();
        if (isAnalysisDone) {
          this.render();
        }
      });
    }
  },

  _onFormModelChanged: function () {
    var isAnalysisDone = this._isAnalysisDone();
    var isDone = this._viewModel.get('isNewAnalysis') || isAnalysisDone;
    var canSave = this._formModel.isValid() && isDone;

    this._viewModel.set({
      hasChanges: true,
      type: this._formModel.get('type'),
      isDisabled: !canSave
    });

    this.render();
    this._fetchQuotaIfNeeded();
  },

  _fetchQuotaIfNeeded: function () {
    var type = this._formModel.get('type');
    var isValid = this._formModel.isValid();
    var quota = this._quotaInfo;
    if ((quota.needsCheck() || AnalysesQuotaOptions.requiresQuota(type, quota)) && isValid) {
      this._fetchQuota();
    }
  },

  _fetchQuota: function () {
    this._infoboxModel.set('state', 'fetching');

    this._quotaInfo.fetch({
      success: function () {
        this._buildQuotaViewInfo();
      }.bind(this),
      error: function (error) {
        this._viewModel.set({error: error});
        this._infoboxModel.set('state', 'error');
      }.bind(this)
    });
  },

  _createButtonView: function () {
    var label = this._formModel.get('persisted')
        ? _t('editor.layers.analysis-form.apply-btn')
        : _t('editor.layers.analysis-form.create-btn');

    this._viewModel.set({
      label: label,
      isDisabled: !this._canSave()
    });

    return new AnalysisButtonView({
      template: template,
      model: this._viewModel
    });
  },

  _buildQuotaViewInfo: function () {
    var formModel = this._formModel;
    var userModel = this._userModel;
    var type = formModel.get('type');
    var service = AnalysesQuotaOptions.getServiceName(type);
    var query = this._querySchemaModel.get('query');
    var quotaData = this._quotaInfo;

    this.payload = {};
    this.payload.type = type;

    var errorCallback = function (error) {
      this._viewModel.set('error', error);
      this._infoboxModel.set('state', 'error');
    }.bind(this);

    var checkEnoughQuota = function (data) {
      // Apply transformation to the input
      // for example isolines takes tracts in in order to calculate estimation
      var rows = AnalysesQuotaOptions.transformInput(type, data, formModel);
      this.payload.estimation = rows;
      // with the input, we calculate wether the quota is enough
      return AnalysesQuotaEnough.fetch(service, rows);
    }.bind(this);

    var buildPayload = function (enoughQuota) {
      var payload = this.payload;
      // then we can get the full set of data
      payload.quotaInfo = AnalysesQuotaProvider(type, userModel, quotaData, enoughQuota);
      payload.creditsLeft = payload.quotaInfo.totalQuota - payload.quotaInfo.usedQuota;
      payload.canRunAnalysis = ((enoughQuota && payload.quotaInfo.totalQuota > 0) ||
                               (payload.quotaInfo.hardLimit === false && payload.quotaInfo.totalQuota > 0));

      // finally we are ready to show the information
      this._infoboxModel.set('state', 'ready');
    }.bind(this);

    var dsReady = quotaData.isReady();

    // Only checks api if analysis belongs to a service with quota
    if (service !== null && dsReady) {
      if (formModel.isValid()) {
        // get the estimation for this analysis
        AnalysesQuotaEstimation.fetch(query)
          .then(checkEnoughQuota, errorCallback)
          .then(buildPayload, errorCallback);
      } else {
        // to render the simple button view.
        this.render();
      }
    } else if (!dsReady) {
      errorCallback(_t('editor.layers.analysis-form.quota.quota-dataservice-down'));
    }
  },

  _createQuotaView: function () {
    var states = [
      {
        state: 'fetching',
        createContentView: function () {
          return InfoboxFactory.createLoading({
            body: _t('editor.layers.analysis-form.quota.loading')
          });
        }
      },
      {
        state: 'ready',
        createContentView: function () {
          var payload = this.payload;
          var confirmLabel = _t('editor.layers.analysis-form.confirm-analysis');
          var quotaMessage = '';

          if (payload.creditsLeft > 0) {
            quotaMessage = _t('editor.layers.analysis-form.quota.credits-left-message', {
              smart_count: payload.creditsLeft
            });
          } else {
            quotaMessage = _t('editor.layers.analysis-form.quota.no-credits-message');
          }
          payload.quotaInfo.quotaMessage = quotaMessage;

          var dataInfobox = _.extend(AnalysesQuotaPresenter.make(payload, this._configModel, this._userModel), {
            title: _t('editor.layers.analysis-form.quota.title'),
            mainAction: {
              label: confirmLabel,
              type: 'primary',
              disabled: !this._canSave() || !payload.canRunAnalysis
            },
            quota: payload.quotaInfo
          });

          return InfoboxFactory.createQuota(dataInfobox);
        }.bind(this),
        mainAction: function () {
          var payload = this.payload;
          if (this._canSave() && payload.canRunAnalysis) {
            this._saveAnalysis();
          }
        }.bind(this),
        closeAction: function () {
          this._stackLayoutModel.prevStep('layers');
        }.bind(this)
      },
      {
        state: 'error',
        createContentView: function () {
          return InfoboxFactory.createWithAction({
            title: _t('editor.layers.analysis-form.quota.title'),
            type: 'error',
            body: _t('editor.layers.analysis-form.quota.quota-fetch-error', {
              error: this._viewModel.get('error')
            }),
            mainAction: {
              label: _t('editor.layers.analysis-form.quota.cancel')
            }
          });
        }.bind(this),
        mainAction: function () {
          this._stackLayoutModel.prevStep('layers');
        }.bind(this)
      }
    ];

    return new AnalysisQuotaView({
      className: 'Infobox-wrapper',
      infoboxModel: this._infoboxModel,
      infoboxCollection: new InfoboxCollection(states)
    });
  },

  _canSave: function () {
    var isAnalysisDone = this._isAnalysisDone();
    var isDone = this._viewModel.get('isNewAnalysis') || isAnalysisDone;
    var hasChanges = this._viewModel.get('hasChanges');
    return this._formModel.isValid() && isDone && hasChanges;
  },

  _onSaveClicked: function () {
    if (this._canSave()) {
      this._saveAnalysis();
    }
  },

  _hasChanges: function () {
    return this._viewModel.get('hasChanges') === true;
  },

  _isAnalysisDone: function () {
    return this._analysisNode && (this._analysisNode.isDone() || this._analysisNode.hasFailed());
  },

  _saveAnalysis: function () {
    this._infoboxModel.set('state', 'idle');
    this._userActions.saveAnalysis(this._formModel);
    this._viewModel.set('hasChanges', false);
    this.render();
  }
});
