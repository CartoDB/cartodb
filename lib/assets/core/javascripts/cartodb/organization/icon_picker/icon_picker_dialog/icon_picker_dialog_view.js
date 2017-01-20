var cdb = require('cartodb.js-v3');
var IconPickerDialog = require('../../../../../javascripts/cartodb/common/dialogs/map/image_picker_view');
var UserIconsView = require('./user_icons_view');

module.exports = IconPickerDialog.extend({

  className: 'Dialog Modal IconPickerDialog',

  events: IconPickerDialog.extendEvents({
    'click .js-addIcon': '_onAddIconClicked'
  }),

  initialize: function () {
    if (!this.options.user) { throw new Error('User is required.'); }
    this._user = this.options.user;

    this.elder('initialize');

    this.kind = this.options.kind;
    this.model = new cdb.core.Model();

    this._template = cdb.templates.getTemplate('organization/icon_picker/icon_picker_dialog/icon_picker_dialog_template');
    this._initBinds();
    this._onChangePane();
  },

  _initViews: function () {
    this._renderContentPane();
    this._renderTabPane();

    this._renderUserIconsPane();

    this._contentPane.active('your_icons');
  },

  _renderContentPane: function () {
    this._contentPane = new cdb.ui.common.TabPane({
      el: this.el
    });

    this.addView(this._contentPane);
    this._contentPane.active(this.model.get('contentPane'));
  },

  _renderUserIconsPane: function () {
    var pane = new UserIconsView({
      orgId: this._user.organization.get('id')
    });

    this._renderPane('your_icons', pane);
  },

  _onAddIconClicked: function (event) {
    this.killEvent(event);

    this._hideErrorMessage();
    this.$('.js-inputFile').trigger('click');
  },

  _hideErrorMessage: function () {
    this._hide('.js-errorMessage');
  },

  _hide: function (selector) {
    this.$(selector).addClass('is-hidden');
  }
});
