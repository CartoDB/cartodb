const _ = require('underscore');
const $ = require('jquery');
const CoreView = require('backbone/core-view');
const pluralizeStr = require('dashboard/helpers/pluralize');
const template = require('./start-view.tpl');

const DISABLED_SAVE_CLASS_NAME = 'is-disabled';
const SHARED_ENTITIES_SAMPLE_SIZE = 5;

const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'configModel',
  'privacyOptions',
  'userModel',
  'visModel'
];

/**
 * View represent the start screen when opening the privacy dialog.
 * Display privacy options and possibly a upgrade or share banner depending on user privileges.
 */
module.exports = CoreView.extend({

  events: {
    'click .js-option': '_onClickOption',
    'click .js-share': '_onClickShare',
    'keyup .js-password-input': '_onKeyUpPasswordInput'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
    this._initBinds();
  },

  render: function () {
    // Password might not be available (i.e. for changing privacy of a dataset)
    const pwdOption = this._privacyOptions.passwordOption();
    const password = pwdOption ? pwdOption.get('password') : '';
    const selectedOption = this._privacyOptions.selectedOption();
    const sharedEntities = this._visModel.permission.getUsersWithAnyPermission();

    this.$el.html(
      template({
        vis: this._visModel,
        privacyOptions: this._privacyOptions,
        password,
        saveBtnClassNames: selectedOption.canSave() ? '' : DISABLED_SAVE_CLASS_NAME,
        upgradeBannerData: this._getUpgradeBannerData(),
        showShareBanner: this._userModel.organization,
        sharedEntitiesCount: sharedEntities.length,
        personOrPeopleStr: pluralizeStr('person', 'people', sharedEntities.length),
        sharedEntitiesSampleCount: SHARED_ENTITIES_SAMPLE_SIZE,
        sharedEntitiesSample: _.take(sharedEntities, SHARED_ENTITIES_SAMPLE_SIZE),
        sharedWithOrganization: this._visModel.permission.isSharedWithOrganization()
      })
    );

    this.delegateEvents();

    return this;
  },

  _initBinds: function () {
    this.listenTo(this._privacyOptions, 'change:selected change:disabled', this.render);
    this.listenTo(this._privacyOptions, 'change:password', this._onChangePassword);
  },

  _getUpgradeBannerData: function () {
    const publicMapsCount = this._userModel.getTotalPublicMapsCount();
    const publicMapsQuota = this._userModel.get('public_map_quota');
    const privateMapsCount = this._userModel.getTotalPrivateMapsCount();
    const privateMapsQuota = this._userModel.get('private_map_quota');
    const publicSharingIsDisabled = this._visModel.isVisualization() ? this._userModel.hasPublicMapSharingDisabled() : this._userModel.hasPublicDatasetSharingDisabled();
    const userHasNoRemainingMaps = !this._userModel.hasRemainingPublicMaps() || !this._userModel.hasRemainingPrivateMaps();

    return {
      show: userHasNoRemainingMaps && !publicSharingIsDisabled,
      upgradeUrl: this._configModel.get('upgrade_url'),
      hasRemainingPublicMaps: this._userModel.hasRemainingPublicMaps(),
      hasRemainingPrivateMaps: this._userModel.hasRemainingPrivateMaps(),
      publicCounter: publicMapsCount + '/' + publicMapsQuota,
      privateCounter: privateMapsCount + '/' + privateMapsQuota
    };
  },

  _onClickOption: function (event) {
    const index = $(event.target).closest('.js-option').data('index');
    const option = this._privacyOptions.at(index);

    if (!option.get('disabled')) {
      option.set('selected', true);
    }

    const pwdOption = this._privacyOptions.passwordOption();

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
    this.$('.ok').toggleClass(DISABLED_SAVE_CLASS_NAME, !this._privacyOptions.selectedOption().canSave());
  },

  _onKeyUpPasswordInput: function (event) {
    this._privacyOptions.passwordOption().set('password', event.target.value);
  },

  _onClickShare: function (event) {
    this.killEvent(event);
    this.trigger('clickedShare');
  }
});
