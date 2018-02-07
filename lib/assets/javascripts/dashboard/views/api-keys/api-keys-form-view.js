const Backbone = require('backbone');
const CoreView = require('backbone/core-view');
require('cartodb3/components/form-components/index');
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

    this._formModel = new Backbone.Model({
      schema: {
        name: {
          type: 'Text',
          title: 'Name',
          validators: ['required'],
          editorAttrs: {
            placeholder: 'Your API key name'
          }
        },
        token: {}
      }
    });

    this._formView = new Backbone.Form({
      model: this._formModel,
      template
    });
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
