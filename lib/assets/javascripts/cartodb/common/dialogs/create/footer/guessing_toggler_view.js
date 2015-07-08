var cdb = require('cartodb.js');

/**
 * Manages if upcoming import should guessing or not.
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
    this.model = new cdb.core.Model({
      // Take as default value 'type_guessing' attribute
      guessing: this.createModel.upload.get('type_guessing')
    });
    this._initBinds();
  },

  render: function() {
    var htmlStr = '';
    if (this.createModel.showGuessingToggler()) {
      htmlStr = this.template({
        isGuessingEnabled: this.model.get('guessing'),
        importState: this.createModel.getImportState(),
        isUploadValid: this.createModel.upload.isValidToUpload(),
        customHosted: cdb.config.get('custom_com_hosted')
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
    this.createModel.upload.setGuessing(value);
  }
});
