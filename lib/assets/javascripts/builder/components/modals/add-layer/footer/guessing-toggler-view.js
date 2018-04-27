var CoreView = require('backbone/core-view');
var template = require('./guessing-toggler.tpl');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'createModel',
  'guessingModel',
  'configModel',
  'userModel'
];

/**
* Manages if upcoming import should guess or not.
 * Expected to be rendered in the footer of a create dialog.
 */

module.exports = CoreView.extend({

  events: {
    'click .js-toggle': '_toggle'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._initBinds();
  },

  render: function () {
    var htmlStr = '';
    if (this._createModel.showGuessingToggler()) {
      var uploadModel = this._createModel.getUploadModel();
      htmlStr = template({
        isGuessingEnabled: this._guessingModel.get('guessing'),
        importState: this._createModel.getImportState(),
        isUploadValid: uploadModel.isValidToUpload(),
        customHosted: this._configModel.get('cartodb_com_hosted'),
        isTwitterDeprecatedForUser: !this._userModel.hasOwnTwitterCredentials()
      });
    }
    this.$el.html(htmlStr);
    return this;
  },

  _initBinds: function () {
    this._createModel.bind('change', this.render, this);
    this._guessingModel.bind('change', this.render, this);
    this.add_related_model(this._createModel);
  },

  _toggle: function () {
    var value = !this._guessingModel.get('guessing');
    this._guessingModel.set('guessing', value);
  }
});
