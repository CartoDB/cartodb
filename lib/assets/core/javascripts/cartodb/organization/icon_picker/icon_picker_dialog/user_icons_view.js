var cdb = require('cartodb.js-v3');
var DialogIconPickerView = require('../icons/organization_icons_view');
var DialogIconCollection = require('../icons/organization_icon_collection');

module.exports = cdb.core.View.extend({

  initialize: function() {
    if (!this.options.user) { throw new Error('user ID is required.'); }
    this._user = this.options.user;

    this.template = cdb.templates.getTemplate('organization/icon_picker/icon_picker_dialog/assets_template');
    this.render();
  },

  render: function() {
    this.clearSubViews();
    this.$el.html(this.template());
    this._renderAssets();
    return this;
  },

  _renderAssets: function() {
    if (this.$('.js-dialogIconPicker').length > 0) {
      this.icon_picker = new DialogIconPickerView({
        el: this.$('.js-dialogIconPicker'),
        user: this._user
      });
    }
  }
});
