var cdb = require('cartodb.js-v3');
var ImagePickerNavigationView = require('../../../../../javascripts/cartodb/common/dialogs/map/image_picker/navigation_view');

module.exports = ImagePickerNavigationView.extend({

  initialize: function () {
    this.model = this.options.model;
    this.kind = this.options.kind;
    this.collection = this.options.collection;
    this.template = cdb.templates.getTemplate('organization/icon_picker/icon_picker_dialog/navigation_template');

    this._initBinds();
  },

  render: function () {
    this.$('.js-navigation').html(
      this.template({
        dropbox_enabled: this.model.get('dropbox_enabled'),
        pane: this.model.get('pane')
      })
    );

    if (this.collection.where({ kind: this.kind }).length > 0) {
      var type = 'your_icons';
      this.$el.find('[data-type="' + type + '"]').removeClass('is-disabled');
    }

    return this;
  }
});
