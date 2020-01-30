const CoreView = require('backbone/core-view');
const BillingProjectModel = require('./billing-project-model');
const template = require('./billing-project.tpl');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'configModel'
];

module.exports = CoreView.extend({

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._initModels();
  },

  render: function () {
    this.$el.html(
      template({
        options: this.model.get('projects')
      })
    );

    this._initSelect();
    return this;
  },

  _initModels: function () {
    const self = this;
    this.model = new BillingProjectModel({}, {
      configModel: this._configModel
    });

    this.model.bind('change:loaded', this.render, this);
    this.model.fetch({
      complete: function () {
        self.model.set('loaded', true);
      }
    });
  },

  _initSelect: function () {
    const self = this;
    const billingProjectSelect = this.$el.find('select')[0];

    this.localStorageName = 'carto.bigQuery.billingProject';

    billingProjectSelect.value = localStorage.getItem(this.localStorageName);
    billingProjectSelect.onchange = function () {
      localStorage.setItem(self.localStorageName, this.value);
    };
  }
});
