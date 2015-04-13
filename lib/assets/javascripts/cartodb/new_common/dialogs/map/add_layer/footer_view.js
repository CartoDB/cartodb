var cdb = require('cartodb.js');

/**
 * Footer view for the add layer modal.
 */
module.exports = cdb.core.View.extend({

  initialize: function() {
    this.elder('initialize');
    this._template = cdb.templates.getTemplate('new_common/dialogs/map/add_layer/footer');
    this.model.bind('change:listing', this._onChangeListing.bind(this));
  },

  // implements cdb.ui.common.Dialog.prototype.render
  render: function() {
    this.$el.html(
      this._template({
        listing: this.model.get('listing')
      })
    );
    return this;
  },

  _onChangeListing: function() {
    switch (this.model.get('listing')) {
      case 'scratch':
        this.hide();
        break;
      default:
        this.render();
        this.show();
    }
  }
});
