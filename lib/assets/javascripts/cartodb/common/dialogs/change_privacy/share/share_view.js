var cdb = require('cartodb.js');
var $ = require('jquery');
var _ = require('underscore');
var BaseDialog = require('../../../views/base_dialog/view');
var randomQuote = require('../../../view_helpers/random_quote');
var ViewFactory = require('../../../view_factory');
var PermissionsView = require('./permissions_view');
var ShareModel = require('./share_model');

/**
 * Dialog to share item with other users in organization.
 */
module.exports = BaseDialog.extend({

  events: function() {
    return _.extend({}, BaseDialog.prototype.events, {
      'click .js-back': '_openChangePrivacy'
    });
  },

  initialize: function() {
    if (!this.options.ChangePrivacyView) throw new Error('ChangePrivacyView is required');
    this.model = new ShareModel({
      vis: this.options.vis,
      organization: this.options.user.organization
    });
    this.elder('initialize');
    this._initViews();
    this._initBinds();
  },

  render: function() {
    BaseDialog.prototype.render.apply(this, arguments);
    this._panes.getActivePane().delegateEvents(); // necessary because of how the content are added
    this.$('.content').addClass('Dialog-content--expanded');
    return this;
  },

  /**
   * @implements cdb.ui.common.Dialog.prototype.render_content
   */
  render_content: function() {
    // This is necessary because of how the special styles requires the DOM to be constructed in a certain order for
    // the scroll to work :/
    var $content = this._panes.getActivePane().render().el;
    if (this._panes.getActivePane() !== this._panes.getPane('sharing')) {
      return [
        this._headerEl(),
        $content
      ];
    } else {
      return $content;
    }
  },

  /**
   * @implements cdb.ui.common.Dialog.prototype.ok
   */
  ok: function() {
    var self = this;
    this._panes.active('sharing');
    var permission = this.options.vis.permission;
    permission.overwriteAcl(this.model.get('permission'));
    permission.save()
      .done(function() {
        self._openChangePrivacy();
      })
      .fail(function() {
        self._panes.active('saveFail');
      });
  },

  _initViews: function() {
    this._panes = new cdb.ui.common.TabPane({
      el: this.el
    });
    this.addView(this._panes);
    this._panes.addTab('permissions',
      new PermissionsView({
        model: this.model,
        ChangePrivacyView: this.options.ChangePrivacyView
      })
    );
    this._panes.addTab('sharing',
      ViewFactory.createByTemplate('common/templates/loading', {
        title: 'Sharing…',
        quote: randomQuote()
      }).render()
    );
    this._panes.addTab('saveFail',
      ViewFactory.createByTemplate('common/templates/fail', {
        msg: ''
      }).render()
    );
    this._panes.active('permissions');
  },

  _initBinds: function() {
    this._panes.bind('tabEnabled', this.render, this);
  },

  _headerEl: function() {
    return $(
      cdb.templates.getTemplate('common/dialogs/change_privacy/share/header')({
        name: this.options.vis.get('name')
      })
    )[0];
  },

  _openChangePrivacy: function() {
    var view = new this.options.ChangePrivacyView({
      clean_on_hide: true,
      enter_to_confirm: true,
      vis: this.options.vis,
      user: this.options.user
    });
    view.appendToBody();
    this.close();
  }
});
