const ImportRequestView = require('./import-request-view');

module.exports = ImportRequestView.extend({
  step1: {
    selector: '.js-step1',
    description: _t('components.modals.add-layer.imports.request.beta.desc'),
    buttonClass: 'js-request',
    cta: _t('components.modals.add-layer.imports.request.beta.cta')
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

  _renderSteps: function () {
    this.step1.title = this._title;
    this._renderStep(this.step1);
    this._renderStep(this.step3);
    this._renderStep(this.step4);
  },

  _getRequestType: function () {
    return 'beta';
  }
});
