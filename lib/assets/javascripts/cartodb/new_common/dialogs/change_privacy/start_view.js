var cdb = require('cartodb.js');
var _ = require('underscore');
var $ = require('jquery');

var DISABLED_SAVE_CLASS_NAME = 'is-disabled';

/**
 * View represent the start screen when opening the privacy dialog.
 * Display privacy options and possibly a upgrade or share banner depending on user privileges.
 */
module.exports = cdb.core.View.extend({

  events: {
    'click .js-save' : '_onClickSave',
    'click .js-option' : '_selectOption',
    'click .js-share' : '_onClickShare',
    'keyup .js-password-input' : '_updatePassword'
  },

  initialize: function() {
    if (!this.options.viewModel) {
      throw new Error('viewModel is compulsory');
    }
    this._viewModel = this.options.viewModel;
    this._viewModel.get('privacyOptions').bind('change', this.render, this);
    this.add_related_model(this._viewModel);

    this.template = cdb.templates.getTemplate('new_common/dialogs/change_privacy/start_view_template');
  },

  render: function() {
    this.clearSubViews();

    var privacyOptions = this._viewModel.get('privacyOptions');
    var pwdOption = privacyOptions.passwordOption();
    var selectedOption = privacyOptions.selectedOption();
    var upgradeUrl = cdb.config.get('upgrade_url');

    this.$el.html(
      this.template({
        itemName: this._viewModel.get('vis').get('name'),
        options: privacyOptions,
        showPasswordInput: pwdOption === selectedOption,
        pwdOption: pwdOption,
        saveBtnClassNames: selectedOption.canSave() ? '' : DISABLED_SAVE_CLASS_NAME,
        showUpgradeBanner: upgradeUrl && privacyOptions.any(function(o) { return !!o.get('disabled'); }),
        upgradeUrl: upgradeUrl,
        showTrial: this._viewModel.get('user').canStartTrial(),
        showShareBanner: this._viewModel.shouldShowShareBanner()
      })
    );

    return this;
  },

  _selectOption: function(ev) {
    var i = $(ev.target).closest('.js-option').data('index');
    var option = this._viewModel.get('privacyOptions').at(i);

    if (!option.get('disabled')) {
      option.set('selected', true);
    }
  },

  _updatePassword: function(ev) {
    // Reflect state directly in DOM instead of re-rendering to avoid loosing the focus on input
    var pwd = ev.target.value;
    this._viewModel.get('privacyOptions').passwordOption().set({ password: pwd }, { silent: true });
    this.$('.js-save')[ _.isEmpty(pwd) ? 'addClass' : 'removeClass' ](DISABLED_SAVE_CLASS_NAME);
  },

  _onClickShare: function(ev) {
    if (this._viewModel.canSave()) {
      this.killEvent(ev);
      this._viewModel.changeState('Share');
    }
  },

  _onClickSave: function(ev) {
    this.killEvent(ev);
    this._viewModel.save();
  }
});
