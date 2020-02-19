const CoreView = require('backbone/core-view');
const BillingProjectModel = require('./billing-project-model');
const template = require('./billing-project.tpl');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'configModel'
];

module.exports = CoreView.extend({

  _LOCAL_STORAGE_KEY: 'carto.bigQuery.billingProject',

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

    billingProjectSelect.value = localStorage.getItem(this._LOCAL_STORAGE_KEY);
    billingProjectSelect.onchange = function () {
      localStorage.setItem(self._LOCAL_STORAGE_KEY, this.value);
    };
  }
});
