var cdb = require('cartodb.js-v3');
var BaseDialog = require('../../../../../javascripts/cartodb/common/views/base_dialog/view');
var DialogIconPickerView = require('../icons/organization_icons_view');

module.exports = BaseDialog.extend({

  className: 'Dialog Modal IconPickerDialog',

  events: BaseDialog.extendEvents({
    'click .js-addIcon': '_onAddIconClicked'
  }),

  initialize: function () {
    if (!this.options.orgId) { throw new Error('Organization ID is required.'); }
    this._orgId = this.options.orgId;

    this.elder('initialize');

    this._template = cdb.templates.getTemplate('organization/icon_picker/icon_picker_dialog/icon_picker_dialog_template');
  },

  render: function () {
    this.clearSubViews();
    BaseDialog.prototype.render.call(this);
    this.$('.content').addClass('Dialog-content--expanded');
    this._initViews();
    return this;
  },

  _initViews: function () {
    this.icon_picker = new DialogIconPickerView({
      el: this.$('.js-dialogIconPicker'),
      orgId: this._orgId
    });
    this.addView(this.icon_picker);

    this.icon_picker.model.on('change:isProcessRunning', this._onIsProcessRunningChanged, this);
  },

  _onIsProcessRunningChanged: function () {
    var running = this.icon_picker.model.get('isProcessRunning');
    if (running) {
      this.$el.css('pointer-events', 'none');
    } else {
      this.$el.css('pointer-events', 'auto');
    }
  },

  // implements cdb.ui.common.Dialog.prototype.render
  render_content: function () {
    return this._template();
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
