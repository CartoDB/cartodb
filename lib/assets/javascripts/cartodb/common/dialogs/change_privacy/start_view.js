var cdb = require('cartodb.js');
var _ = require('underscore');
var $ = require('jquery');
var pluralizeStr = require('../../view_helpers/pluralize_string');

var DISABLED_SAVE_CLASS_NAME = 'is-disabled';
var SHARED_ENTITIES_SAMPLE_SIZE = 5;

/**
 * View represent the start screen when opening the privacy dialog.
 * Display privacy options and possibly a upgrade or share banner depending on user privileges.
 */
module.exports = cdb.core.View.extend({

  events: {
    'click .js-option': '_selectOption',
    'click .js-share': '_onClickShare',
    'keyup .js-password-input': '_updatePassword'
  },

  initialize: function() {
    this.elder('initialize');
    if (!this.options.privacyOptions) throw new Error('privacyOptions is required');
    if (!this.options.user) throw new Error('user is required');
    if (!this.options.vis) throw new Error('vis is required');
    this.template = cdb.templates.getTemplate('common/dialogs/change_privacy/start');
    this._initBinds();
  },

  render: function() {
    var pwdOption = this.options.privacyOptions.passwordOption();
    var selectedOption = this.options.privacyOptions.selectedOption();
    var upgradeUrl = cdb.config.get('upgrade_url');
    var sharedEntities = this.options.vis.permission.getUsersWithAnyPermission();

    this.$el.html(
      this.template({
        vis: this.options.vis,
        privacyOptions: this.options.privacyOptions,
        showPasswordInput: pwdOption === selectedOption,
        pwdOption: pwdOption,
        saveBtnClassNames: selectedOption.canSave() ? '' : DISABLED_SAVE_CLASS_NAME,
        showUpgradeBanner: upgradeUrl && this.options.privacyOptions.any(function(o) { return !!o.get('disabled'); }),
        upgradeUrl: upgradeUrl,
        showTrial: this.options.user.canStartTrial(),
        showShareBanner: this.options.user.organization,
        sharedEntitiesCount: sharedEntities.length,
        personOrPeopleStr: pluralizeStr('person', 'people', sharedEntities.length),
        sharedEntitiesSampleCount: SHARED_ENTITIES_SAMPLE_SIZE,
        sharedEntitiesSample: _.take(sharedEntities, SHARED_ENTITIES_SAMPLE_SIZE),
        sharedWithOrganization: this.options.vis.permission.isSharedWithOrganization()
      })
    );

    this.delegateEvents();

    return this;
  },

  _initBinds: function() {
    this.options.privacyOptions.bind('change', this.render, this);
  },

  _selectOption: function(ev) {
    var i = $(ev.target).closest('.js-option').data('index');
    var option = this.options.privacyOptions.at(i);

    if (!option.get('disabled')) {
      option.set('selected', true);
    }
  },

  _updatePassword: function(ev) {
    // Reflect state directly in DOM instead of re-rendering to avoid loosing the focus on input
    var pwd = ev.target.value;
    this.options.privacyOptions.passwordOption().set({ password: pwd }, { silent: true });
    this.$('.ok')[ _.isEmpty(pwd) ? 'addClass' : 'removeClass' ](DISABLED_SAVE_CLASS_NAME);
  },

  _onClickShare: function(ev) {
    this.killEvent(ev);
    this.trigger('clickedShare');
  }
});
