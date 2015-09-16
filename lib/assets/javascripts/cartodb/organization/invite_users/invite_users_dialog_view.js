var cdb = require('cartodb.js');
var BaseDialog = require('../../common/views/base_dialog/view');
var randomQuote = require('../../common/view_helpers/random_quote');
var ViewFactory = require('../../common/view_factory');
var InviteUsersFormView = require('./invite_users_form_view');
var _ = require('underscore');


/**
 *  Edit visualization (dataset or map) dialog
 *
 */
module.exports = BaseDialog.extend({

  className: 'Dialog is-opening',

  initialize: function() {
    this.elder('initialize');
    this.organization = this.options.organization;
    this.organizationUsers = this.options.organizationUsers;
    // if (!this.options.vis) {
    //   throw new TypeError('vis model is required');
    // }
    //
    // this.vis = this.options.vis;
    // this.user = this.options.user;
    // this.dataLayer = this.options.dataLayer;
    // this.model = new EditVisMetadataModel({}, {
    //   vis: this.vis,
    //   dataLayer: this.dataLayer,
    //   user: this.user
    // });
    this.template = cdb.templates.getTemplate('organization/invite_users/invite_users_dialog_template');
  },

  render: function() {
    this.clearSubViews();
    BaseDialog.prototype.render.call(this);
    this.$('.content').addClass('Dialog-content--expanded');
    this._initViews();
    return this;
  },

  render_content: function() {
    return this.template();
  },

  _initViews: function() {
    // Panes
    this._panes = new cdb.ui.common.TabPane({
      el: this.$('.js-content')
    });

    // Create form
    var form = new InviteUsersFormView({
      el: this.$('.js-form')
    });

    form.bind('onSubmit', this._sendInvites, this);
    this._panes.addTab('form', form.render());

    // Create loading
    this._panes.addTab('loading',
      ViewFactory.createByTemplate('common/templates/loading', {
        title: 'Sending invites...',
        quote: randomQuote()
      }).render()
    );

    // Create error
    this._panes.addTab('error',
      ViewFactory.createByTemplate('common/templates/fail', {
        msg: 'Sorry, something went wrong.'
      }).render()
    );

    this._panes.active('form');
  },

  _sendInvites: function() {

  }

});
