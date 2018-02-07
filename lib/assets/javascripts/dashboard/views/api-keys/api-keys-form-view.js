const CoreView = require('backbone/core-view');
const checkAndBuildOpts = require('cartodb3/helpers/required-opts');
const template = require('./api-keys-form.tpl');

const REQUIRED_OPTS = [
  'stackLayoutModel'
];

module.exports = CoreView.extend({
  events: {
    'click .js-back': '_onClickBack'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
  },

  render: function () {
    this.$el.html(
      template()
    );

    return this;
  },

  _onClickBack: function () {
    this._stackLayoutModel.goToStep(0);
  }
});
