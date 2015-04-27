var cdb = require('cartodb.js');

/**
 * Manages the type guess togglerexpected.
 * Expected to be rendered in the footer of a create dialog.
 */
module.exports = cdb.core.View.extend({

  events: {
    'click .js-toggle': '_toggle'
  },

  initialize: function() {
    this.elder('initialize');
    this.template = cdb.templates.getTemplate('new_common/dialogs/create/footer/type_guessing_toggler');
    this._initBinds();
  },

  render: function() {
    var htmlStr = '';
    if (this.model.showTypeGuessingToggler()) {
      htmlStr = this.template({
        isTypeGuessingEnabled: this.model.upload.get('type_guessing'),
        importState: this.model.getImportState(),
        isUploadValid: this.model.upload.isValidToUpload(),
        customHosted: cdb.config.get('custom_com_hosted')
      });
    }
    this.$el.html(htmlStr);
    this.delegateEvents();

    return this;
  },

  _initBinds: function() {
    this.model.bind('change', this.render, this);
    this.model.upload.bind('change:type_guessing', this.render, this);
    this.add_related_model(this.model.upload);
  },

  _toggle: function() {
    if (this.model.upload.isValidToUpload()) {
      this.model.upload.toggleTypeGuessing();
    }
  }
});
