var cdb = require('cartodb.js-v3');
var DialogIconPickerView = require('../icons/organization_icons_view');

module.exports = cdb.core.View.extend({

  initialize: function () {
    if (!this.options.orgId) { throw new Error('orgId ID is required.'); }
    this._orgId = this.options.orgId;

    this.template = cdb.templates.getTemplate('organization/icon_picker/icon_picker_dialog/assets_template');
    this.render();
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(this.template());
    this._renderAssets();
    return this;
  },

  _renderAssets: function () {
    if (this.$('.js-dialogIconPicker').length > 0) {
      this.icon_picker = new DialogIconPickerView({
        el: this.$('.js-dialogIconPicker'),
        orgId: this._orgId
      });
    }
  }
});
