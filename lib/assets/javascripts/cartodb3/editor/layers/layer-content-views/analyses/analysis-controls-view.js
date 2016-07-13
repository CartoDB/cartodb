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
    this._stackLayoutModel = opts.stackLayoutModel;

    this._fetchedModel = false;

    this._formModel.on('change', this.render, this);
    this.add_related_model(this._formModel);
  },

  render: function () {
    var requiresQuota = AnalysesQuotaFactory.requiresQuota(this._formModel.get('type'));
    var html;

    if (requiresQuota) {
      html = this._createQuotaView();
    } else {
      html = this._html;
    }

    this.$el.html(html);
    return this;
  },

  _html: function () {
    return template({
      label: this._formModel.get('persisted')
        ? _t('editor.layers.analysis-form.apply-btn')
        : _t('editor.layers.analysis-form.create-btn'),
      isDisabled: !this._formModel.isValid()
    });
  },

  _createQuotaView: function () {
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
          var quotaInfo = AnalysesQuotaFactory.getQuotaInfo(this._formModel.get('type'), this._userModel);
          return InfoboxFactory.createQuota({
            title: _t('editor.layers.analysis-form.quota.title'),
            body: _t('editor.layers.analysis-form.quota.credits-left', {
              blockSize: quotaInfo.blockSize,
              blockPrice: quotaInfo.blockPrice
            }),
            confirmLabel: _t('editor.layers.analysis-form.quota.confirm'),
            confirmType: 'button',
            cancelLabel: _t('editor.layers.analysis-form.quota.cancel'),
            cancelType: 'link',
            quota: quotaInfo
          });
        }.bind(this),
        mainAction: function () {
          this._stackLayoutModel.prevStep('layers');
        }.bind(this),
        secondAction: function () {
          if (this._formModel.isValid()) {
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
      state: 'loading',
      visible: true
    });

    if (!this._fetchedModel) {
      this._userModel.fetch({
        success: function () {
          this._fetchedModel = true;
          this._infoboxModel.set('state', 'ready');
        }.bind(this),
        error: function () {
          this._infoboxModel.set('state', 'error');
        }.bind(this)
      });
    }

    this.view = new InfoboxView({
      infoboxModel: this._infoboxModel,
      infoboxCollection: new InfoboxCollection(states)
    });

    this.addView(this.view);
    return this.view.render().el;
  },

  _onSaveClicked: function () {
    if (this._formModel.isValid()) {
      this._userActions.saveAnalysis(this._formModel);
    }
  }

});
