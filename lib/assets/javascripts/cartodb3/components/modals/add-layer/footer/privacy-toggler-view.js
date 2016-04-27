var cdb = require('cartodb.js');
var $ = require('jquery');
var template = require('./privacy-toggler.tpl');
var TipsyTooltipView = require('../../../tipsy-tooltip-view');
var publicPrivacy = 'PUBLIC';
var privatePrivacy = 'PRIVATE';

/**
 *  Change the privacy of the new dataset.
 *  - If the user can't change the privacy, it will refer to the upgrade page
 *   unless app is the "open source" version
 *
 */

module.exports = cdb.core.View.extend({
  events: {
    'click': '_onClick'
  },

  initialize: function (opts) {
    if (!opts.createModel) throw new Error('createModel is required');
    if (!opts.privacyModel) throw new Error('privacyModel is required');
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.configModel) throw new TypeError('configModel is required');

    this._configModel = opts.configModel;
    this.model = opts.privacyModel;
    this._userModel = opts.userModel;
    this._createModel = opts.createModel;
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    if (this._createModel.showPrivacyToggler()) {
      var canChangePrivacy = this._userModel.canCreatePrivateDatasets();
      var privacy = this.model.get('privacy');
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
    this.model.bind('change:privacy', this.render, this);
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
      var privacy = this.model.get('privacy');
      this.model.set('privacy', privacy === publicPrivacy ? privatePrivacy : publicPrivacy);
      return;
    }
  }

});
