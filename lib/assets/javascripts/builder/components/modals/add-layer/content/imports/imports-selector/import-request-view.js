const CoreView = require('backbone/core-view');
const checkAndBuildOpts = require('builder/helpers/required-opts');
const template = require('./import-request.tpl');
const singleStepTemplate = require('./import-request-step.tpl');
const HubspotRequest = require('../hubspot-request');

const REQUIRED_OPTS = [
  'userModel',
  'configModel',
  'title',
  'name'
];

/**
 * Cards with additional info in disabled connectors
 */

module.exports = CoreView.extend({
  step1: {
    selector: '.js-step1',
    description: _t('components.modals.add-layer.imports.request.enable.desc'),
    buttonClass: 'js-request',
    cta: _t('components.modals.add-layer.imports.request.enable.cta')
  },

  step3: {
    selector: '.js-step3',
    titleClass: 'title--success',
    title: _t('components.modals.add-layer.imports.request.success.title'),
    description: _t('components.modals.add-layer.imports.request.success.desc'),
    buttonClass: 'js-ok success-icon',
    cta: _t('components.modals.add-layer.imports.request.ok')
  },

  step4: {
    selector: '.js-step4',
    titleClass: 'title--error',
    title: _t('components.modals.add-layer.imports.request.error.title'),
    description: _t('components.modals.add-layer.imports.request.error.desc'),
    buttonClass: 'js-ok success-icon',
    cta: _t('components.modals.add-layer.imports.request.ok')
  },

  events: {
    'click .js-request': '_onRequest',
    'click .js-ok': '_onReset'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
  },

  render: function () {
    this.$el.html(
      template({
        name: this._name,
        title: this._title,
        isEnterprise: this._userModel.isEnterprise(),
        upgradeUrl: this._configModel.get('upgrade_url')
      })
    );
    this.$el.addClass('js-' + this._name + 'Button');

    this._renderSteps();
    return this;
  },

  _renderSteps: function () {
    this.step1.title = this._title;
    this._renderStep(this.step1);
    this._renderStep(this.step3);
    this._renderStep(this.step4);
  },

  _renderStep: function (stepParams) {
    this.$el.find(stepParams.selector).append(singleStepTemplate({
      title: stepParams.title,
      titleClass: stepParams.titleClass,
      description: stepParams.description,
      buttonClass: stepParams.buttonClass,
      cta: stepParams.cta
    }));
  },

  _goToStep (step) {
    this.$('.js-step').removeClass('is-active');
    this.$(`.js-step${step}`).addClass('is-active');
  },

  _onRequest: function () {
    this.$el.addClass('is-active');
    this._goToStep(2);

    const self = this;
    const data = HubspotRequest.getFormData(this._userModel, this._title, this._getRequestType());
    HubspotRequest.requestConnectorHubspot(data,
      function () {
        self._goToStep(3);
      },
      function () {
        self._goToStep(4);
      });
  },

  _getRequestType: function () {
    return 'enable';
  },

  _onReset: function () {
    this.$el.removeClass('is-active');
  }
});
