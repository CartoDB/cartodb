var cdb = require('cartodb-deep-insights.js');
var template = require('./guessing-toggler.tpl');

/**
 * Manages if upcoming import should guess or not.
 * Expected to be rendered in the footer of a create dialog.
 */

module.exports = cdb.core.View.extend({

  events: {
    'click .js-toggle': '_toggle'
  },

  initialize: function (opts) {
    if (!opts.createModel) throw new Error('createModel is required');
    if (!opts.guessingModel) throw new Error('guessingModel is required');
    if (!opts.configModel) throw new TypeError('configModel is required');

    this._configModel = opts.configModel;
    this._createModel = opts.createModel;
    this.model = opts.guessingModel;
    this._initBinds();
  },

  render: function () {
    var htmlStr = '';
    if (this._createModel.showGuessingToggler()) {
      var uploadModel = this._createModel.getUploadModel();
      htmlStr = template({
        isGuessingEnabled: this.model.get('guessing'),
        importState: this._createModel.getImportState(),
        isUploadValid: uploadModel.isValidToUpload(),
        customHosted: this._configModel.get('cartodb_com_hosted')
      });
    }
    this.$el.html(htmlStr);
    return this;
  },

  _initBinds: function () {
    this._createModel.bind('change', this.render, this);
    this.model.bind('change', this.render, this);
    this.add_related_model(this._createModel);
  },

  _toggle: function () {
    var value = !this.model.get('guessing');
    this.model.set('guessing', value);
  }
});
