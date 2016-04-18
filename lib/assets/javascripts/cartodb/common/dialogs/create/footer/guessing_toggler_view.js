var cdb = require('cartodb.js-v3');

/**
 * Manages if upcoming import should guess or not.
 * Expected to be rendered in the footer of a create dialog.
 */
module.exports = cdb.core.View.extend({

  events: {
    'click .js-toggle': '_toggle'
  },

  initialize: function() {
    this.elder('initialize');
    this.createModel = this.options.createModel;
    this.template = cdb.templates.getTemplate('common/dialogs/create/footer/guessing_toggler');
    this._initBinds();
  },

  render: function() {
    var htmlStr = '';
    if (this.createModel.showGuessingToggler()) {
      htmlStr = this.template({
        isGuessingEnabled: this.model.get('guessing'),
        importState: this.createModel.getImportState(),
        isUploadValid: this.createModel.upload.isValidToUpload(),
        customHosted: cdb.config.get('cartodb_com_hosted')
      });
    }
    this.$el.html(htmlStr);

    return this;
  },

  _initBinds: function() {
    this.createModel.bind('change', this.render, this);
    this.model.bind('change', this.render, this);
    this.add_related_model(this.createModel);
  },

  _toggle: function() {
    var value = !this.model.get('guessing');
    this.model.set('guessing', value);
  }
});
