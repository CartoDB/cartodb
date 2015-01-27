var cdb = require('cartodb.js');
var _ = require('underscore');

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
    'keyup .js-password-input' : '_updatePassword',
    'blur .js-password-input' : 'render' // make sure the view is consistently rendered after writing password
  },

  initialize: function(args) {
    this.vis = args.vis; // of model cdb.admin.Visualization
    this.user = args.user;
    this.upgradeUrl = args.upgradeUrl;
    this.privacyOptions = args.privacyOptions;
    
    this.template = cdb.templates.getTemplate('new_dashboard/dialogs/change_privacy/start_view_template');

    this.privacyOptions.bind('change', this.render, this);
    this.add_related_model(this.privacyOptions);
  },

  render: function() {
    var pwdOption = this.privacyOptions.passwordOption();
    var selectedOption = this.privacyOptions.selectedOption();
    var org = this.user.organization;

    this.$el.html(
      this.template({
        itemName: this.vis.get('name'),
        options: this.privacyOptions,
        showPasswordInput: pwdOption === selectedOption,
        pwdOption: pwdOption,
        saveBtnClassNames: selectedOption.canSave() ? '' : DISABLED_SAVE_CLASS_NAME,
        showUpgradeBanner: !!this.upgradeUrl && this.privacyOptions.any(function(option) { return !!option.get('disabled'); }),
        upgradeUrl: this.upgradeUrl,
        showShareBanner: !!org,
        orgUsersCount: org && org.users.length
      })
    );
    
    return this;
  },

  _selectOption: function(ev) {
    var option = this.privacyOptions.at( $(ev.target).closest('.js-option').attr('data-index') );
    if (!option.get('disabled')) {
      option.set('selected', true);
    }
  },

  _updatePassword: function(ev) {
    // Reflect state directly in DOM instead of re-rendering to avoid loosing the focus on input
    var pwd = ev.target.value;
    this.privacyOptions.passwordOption().set({ password: pwd }, { silent: true });
    this.$('.js-ok')[ _.isEmpty(pwd) ? 'addClass' : 'removeClass' ](DISABLED_SAVE_CLASS_NAME);
  },

  _onClickShare: function(ev) {
    this.killEvent(ev);
    this.trigger('click:share');
  },
  
  _onClickSave: function(ev) {
    this.killEvent(ev);
    this.trigger('click:save');
  }
});
