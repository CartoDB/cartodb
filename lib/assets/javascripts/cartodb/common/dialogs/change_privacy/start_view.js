var cdb = require('cartodb.js-v3');
var _ = require('underscore-cdb-v3');
var $ = require('jquery-cdb-v3');
var pluralizeStr = require('../../view_helpers/pluralize_string');

var DISABLED_SAVE_CLASS_NAME = 'is-disabled';
var SHARED_ENTITIES_SAMPLE_SIZE = 5;

/**
 * View represent the start screen when opening the privacy dialog.
 * Display privacy options and possibly a upgrade or share banner depending on user privileges.
 */
module.exports = cdb.core.View.extend({

  events: {
    'click .js-option': '_onClickOption',
    'click .js-share': '_onClickShare',
    'keyup .js-password-input': '_onKeyUpPasswordInput'
  },

  initialize: function () {
    this.elder('initialize');
    if (!this.options.privacyOptions) throw new Error('privacyOptions is required');
    if (!this.options.user) throw new Error('user is required');
    if (!this.options.vis) throw new Error('vis is required');
    this.template = cdb.templates.getTemplate('common/dialogs/change_privacy/start');
    this._initBinds();
  },

  render: function () {
    // Password might not be available (i.e. for changing privacy of a dataset)
    var pwdOption = this.options.privacyOptions.passwordOption();
    var password = pwdOption ? pwdOption.get('password') : '';

    var selectedOption = this.options.privacyOptions.selectedOption();
    var upgradeUrl = cdb.config.get('upgrade_url');
    var sharedEntities = this.options.vis.permission.getUsersWithAnyPermission();

    this.$el.html(
      this.template({
        vis: this.options.vis,
        privacyOptions: this.options.privacyOptions,
        password: password,
        saveBtnClassNames: selectedOption.canSave() ? '' : DISABLED_SAVE_CLASS_NAME,
        showUpgradeBanner: upgradeUrl && this.options.privacyOptions.any(function (o) { return !!o.get('disabled'); }),
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

  _initBinds: function () {
    this.options.privacyOptions.bind('change:selected change:disabled', this.render, this);
    this.options.privacyOptions.bind('change:password', this._onChangePassword, this);
    this.add_related_model(this.options.privacyOptions);
  },

  _onClickOption: function (ev) {
    var i = $(ev.target).closest('.js-option').data('index');
    var option = this.options.privacyOptions.at(i);

    if (!option.get('disabled')) {
      option.set('selected', true);
    }

    var pwdOption = this.options.privacyOptions.passwordOption();

    if ((option === pwdOption) && (!option.get('disabled'))) {
      this.$('.js-password-input')
        .val('') // reset any existing input value
        .focus()
        .keyup(); // manually trigger a key up event to change password state
    } else if (pwdOption) { // Password might not be available (i.e. for changing privacy of a dataset)
      this.$('.js-password-input').val(pwdOption.get('password'));
    }
  },

  _onChangePassword: function () {
    this.$('.ok').toggleClass(DISABLED_SAVE_CLASS_NAME, !this.options.privacyOptions.selectedOption().canSave());
  },

  _onKeyUpPasswordInput: function (ev) {
    this.options.privacyOptions.passwordOption().set('password', ev.target.value);
  },

  _onClickShare: function (ev) {
    this.killEvent(ev);
    this.trigger('clickedShare');
  }
});
