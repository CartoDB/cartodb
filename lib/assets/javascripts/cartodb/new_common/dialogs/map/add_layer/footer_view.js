var $ = require('jquery');
var cdb = require('cartodb.js');
var TypeGuessingTogglerView = require('../../create/footer/type_guessing_toggler_view');

/**
 * Footer view for the add layer modal.
 */
module.exports = cdb.core.View.extend({

  initialize: function() {
    this.elder('initialize');
    this._template = cdb.templates.getTemplate('new_common/dialogs/map/add_layer/footer');
    this._typeGuessingTogglerView = new TypeGuessingTogglerView({
      model: this.model
    });
    this._initBinds();
  },

  // implements cdb.ui.common.Dialog.prototype.render
  render: function() {
    this.clearSubViews();

    var $el = $(
      this._template({
        canUpload: this.model.canUpload(),
        listing: this.model.get('listing')
      })
    );
    $el.find('.js-footer-info').append(this._typeGuessingTogglerView.render().el);
    this.$el.html($el);

    return this;
  },

  _initBinds: function() {
    this.model.upload.bind('change', this.render, this);
    this.model.bind('change:listing', this._onChangeListing, this);
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
