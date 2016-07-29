var cdb = require('cartodb.js-v3');

/**
 * View for a flash message to be displayed at the header.
 */
module.exports = cdb.core.View.extend({

  className: 'FlashMessage FlashMessage--error CDB-Text',

  initialize: function () {
    if (!this.model) throw new Error('model is required');

    this._template = cdb.templates.getTemplate('organization/flash_message');

    this.model.on('change', this.render, this);
  },

  render: function () {
    this.$el.toggle(this.model.shouldDisplay());
    this.$el.html(this._html());

    return this;
  },

  _html: function () {
    return this._template({
      str: this.model.get('msg')
    });
  }

});
