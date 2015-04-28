var cdb = require('cartodb.js');

/**
 * View to handle the visual representation of a publish option.
 */
module.exports = cdb.core.View.extend({

  className: 'OptionCard',

  initialize: function() {
    this._template = cdb.templates.getTemplate('new_common/dialogs/publish/option');
    this._initBinds();
  },

  render: function() {
    this.$el.html(
      this._template({
        model: this.model
      })
    );

    return this;
  },

  _initBinds: function() {
    this.model.bind('change', this.render, this);
  }
});
