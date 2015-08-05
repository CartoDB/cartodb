var cdb = require('cartodb.js');
var UserPlansCollection = require('./user_plans_collection');
var LimitsReachContentView = require('./limits_reach_content_view');
var BaseDialog = require('../../views/base_dialog/view');
var randomQuote = require('../../view_helpers/random_quote');
var ViewFactory = require('../../view_factory');

/**
 *  Show upgrade possibilities per user type
 *
 */

module.exports = BaseDialog.extend({

  initialize: function() {
    this.user = this.options.user;
    this.userPlans = new UserPlansCollection(null, { user: this.user });
    this.elder('initialize');
    this._initBinds();
  },
  
  render_content: function() {
    var canUpgrade = cdb.config.get('upgrade_url') && !cdb.config.get('custom_com_hosted') && !this.user.isInsideOrg();
    var orgagnizationAdminEmail = this.user.isInsideOrg() && this.user.organization.get('owner').email || '';
    var $el = $(cdb.templates.getTemplate('common/dialogs/limits_reach/limits_reach')({
      canUpgrade: canUpgrade,
      organizationAdmin: this.user.isOrgAdmin(),
      orgagnizationAdminEmail: orgagnizationAdminEmail,
      organizationUser: (this.user.isInsideOrg() && !this.user.isOrgAdmin()),
      layersCount: this.user.get('max_layers'),
      customHosted: cdb.config.get('custom_com_hosted'),
      upgradeURL: cdb.config.get('upgrade_url')
    }));
    this._initViews($el);
    return $el;
  },

  _initBinds: function() {
    this.userPlans.bind('error', function() {
      this._panes.active('error');
    }, this);
    this.userPlans.bind('reset', function() {
      this._panes.active('content');
    }, this);
    this.add_related_model(this.userPlans);
  },

  _initViews: function($el) {
    this._panes = new cdb.ui.common.TabPane({
      el: $el.find('.js-content')
    });
    this.addView(this._panes);
    
    this._panes.addTab('loading',
      ViewFactory.createByTemplate('common/templates/loading', {
        title: 'Getting plans info…',
        quote: randomQuote()
      }).render()
    );

    this._panes.addTab('error',
      ViewFactory.createByTemplate('common/templates/fail', {
        msg: 'Sorry, something went wrong trying to get your available plans.'
      }).render()
    );

    this._panes.addTab('content',
      new LimitsReachContentView({
        model: this.user,
        collection: this.userPlans
      }).render()
    );

    var canUpgrade = cdb.config.get('upgrade_url') && !cdb.config.get('custom_com_hosted') && !this.user.isInsideOrg();

    this._panes.active(canUpgrade ? 'loading' : 'content');

    if (canUpgrade) {
      this.userPlans.fetch();
    }
  }

});
