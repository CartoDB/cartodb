const CoreView = require('backbone/core-view');
const checkAndBuildOpts = require('builder/helpers/required-opts');
const OrganizationIconsView = require('../icons/organization-icons-view');
const template = require('./icon-picker-dialog.tpl');

const REQUIRED_OPTS = [
  'orgId',
  'configModel'
];

module.exports = CoreView.extend({

  className: 'Dialog Modal IconPickerDialog',

  events: {
    'click .js-addIcon': '_onAddIconClicked'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(template());
    this.$('.content').addClass('Dialog-content--expanded');

    this._initViews();

    return this;
  },

  _initViews: function () {
    this.icon_picker = new OrganizationIconsView({
      el: this.$('.js-dialogIconPicker'),
      orgId: this._orgId,
      configModel: this._configModel
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
