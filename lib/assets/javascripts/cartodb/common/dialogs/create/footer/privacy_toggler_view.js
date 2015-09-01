var cdb = require('cartodb.js');

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

  initialize: function() {
    this.user = this.options.user;
    this.createModel = this.options.createModel;
    this.template = cdb.templates.getTemplate('common/dialogs/create/footer/privacy_toggler_template');
    this._initBinds();
  },

  render: function() {
    this.clearSubViews();
    this.$el.empty();

    if (this.createModel.showPrivacyToggler()) {
      var canChangePrivacy = this.user.canCreatePrivateDatasets();
      var privacy = this.model.get('privacy');
      var nexPrivacy = privacy === "PUBLIC" ? "PRIVATE" : "PUBLIC";
      var icon = privacy === "PUBLIC" ? 'Unlock' : 'Lock';
      var canUpgrade = !cdb.config.get('custom_com_hosted') && !canChangePrivacy;

      this.$el.html(
        this.template({
          privacy: privacy,
          isDisabled: !canChangePrivacy,
          canUpgrade: canUpgrade,
          nextPrivacy: nexPrivacy,
          upgradeUrl: window.upgrade_url,
          icon: icon
        })
      );

      this._initViews();
    }

    return this;
  },

  _initBinds: function() {
    this.model.bind('change:privacy', this.render, this);
  },

  _initViews: function() {
    // Tooltip
    this.addView(
      new cdb.common.TipsyTooltip({
        el: this.$('.js-toggler'),
        title: function() {
          return $(this).attr('data-title');
        }
      })
    );
  },

  _onClick: function() {
    if (this.user.canCreatePrivateDatasets()) {
      var privacy = this.model.get('privacy');
      this.model.set('privacy', privacy === "PUBLIC" ? "PRIVATE" : "PUBLIC" );
      return;
    }
  }

});
