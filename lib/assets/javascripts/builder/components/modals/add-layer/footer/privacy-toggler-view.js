var CoreView = require('backbone/core-view');
var $ = require('jquery');
var template = require('./privacy-toggler.tpl');
var TipsyTooltipView = require('builder/components/tipsy-tooltip-view');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var publicPrivacy = 'PUBLIC';
var privatePrivacy = 'PRIVATE';

var REQUIRED_OPTS = [
  'createModel',
  'privacyModel',
  'configModel',
  'userModel'
];

/**
 *  Change the privacy of the new dataset.
 *  - If the user can't change the privacy, it will refer to the upgrade page
 *   unless app is the "open source" version
 *
 */

module.exports = CoreView.extend({
  events: {
    'click': '_onClick'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    if (this._createModel.showPrivacyToggler()) {
      var canChangePrivacy = this._userModel.canCreatePrivateDatasets();
      var privacy = this._privacyModel.get('privacy');
      var isPublic = privacy === publicPrivacy;
      var nextPrivacy = isPublic ? privatePrivacy : publicPrivacy;
      var icon = isPublic ? 'unlock' : 'lock';
      var upgradeUrl = this._configModel.get('upgrade_url') || window.upgrade_url;
      var canUpgrade = !this._configModel.get('cartodb_com_hosted') && !canChangePrivacy && upgradeUrl;

      this.$el.html(
        template({
          privacy: privacy,
          isDisabled: !canChangePrivacy,
          canUpgrade: canUpgrade,
          nextPrivacy: nextPrivacy,
          upgradeUrl: upgradeUrl,
          icon: icon
        })
      );

      this._initViews();
    }

    return this;
  },

  _initBinds: function () {
    this._privacyModel.bind('change:privacy', this.render, this);
  },

  _initViews: function () {
    // Tooltip
    this.addView(
      new TipsyTooltipView({
        el: this.$('.js-toggler'),
        html: true,
        title: function () {
          return $(this).attr('data-title');
        }
      })
    );
  },

  _onClick: function () {
    if (this._userModel.canCreatePrivateDatasets()) {
      var privacy = this._privacyModel.get('privacy');
      this._privacyModel.set('privacy', privacy === publicPrivacy ? privatePrivacy : publicPrivacy);
    }
  }

});
