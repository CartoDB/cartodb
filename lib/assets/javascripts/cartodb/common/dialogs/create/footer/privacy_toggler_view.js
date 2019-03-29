var cdb = require('cartodb.js-v3');
var $ = require('jquery-cdb-v3');

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

  initialize: function () {
    this.elder('initialize');
    this.user = this.options.user;
    this.createModel = this.options.createModel;
    this.template = cdb.templates.getTemplate('common/dialogs/create/footer/privacy_toggler_template');
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    if (this.createModel.showPrivacyToggler()) {
      var canChangePrivacy = this.user.canCreatePrivateDatasets();
      var privacy = this.model.get('privacy');
      var nextPrivacy = privacy === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC';
      var icon = privacy === 'PUBLIC' ? 'unlock' : 'lock';
      var upgradeUrl = cdb.config.get('upgrade_url') || window.upgrade_url;
      var canUpgrade = !cdb.config.get('cartodb_com_hosted') && !canChangePrivacy && upgradeUrl;
      var connectDataset;

      if (this.createModel) {
        var option = this.createModel.getOption && this.createModel.getOption();
        var listingState = this.createModel.get('listing');
        var importState = this.createModel.getImportState && this.createModel.getImportState();

        connectDataset = option && option !== 'loading' &&
          option === 'listing' &&
          listingState === 'import' &&
          typeof importState === 'string' && importState !== 'scratch';
      }

      this.$el.html(
        this.template({
          privacy: privacy,
          isDisabled: !canChangePrivacy,
          canUpgrade: canUpgrade,
          nextPrivacy: nextPrivacy,
          upgradeUrl: upgradeUrl,
          icon: icon,
          connectDataset: connectDataset
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
      new cdb.common.TipsyTooltip({
        el: this.$('.js-toggler'),
        html: true,
        title: function () {
          return $(this).attr('data-title');
        }
      })
    );
  },

  _onClick: function () {
    if (this.user.canCreatePrivateDatasets()) {
      var privacy = this.model.get('privacy');
      this.model.set('privacy', privacy === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC');
      return;
    }
  }

});
