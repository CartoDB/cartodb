var cdb = require('cartodb.js-v3');
var $ = require('jquery-cdb-v3');
var _ = require('underscore-cdb-v3');
var BaseDialog = require('../../../views/base_dialog/view');
var randomQuote = require('../../../view_helpers/random_quote');
var ViewFactory = require('../../../view_factory');
var PagedSearchModel = require('../../../paged_search_model');
var PagedSearchView = require('../../../views/paged_search/paged_search_view');
var ShareModel = require('./share_model');
var GrantablesView = require('./grantables_view');

/**
 * Dialog to share item with other users in organization.
 */
module.exports = BaseDialog.extend({

  events: BaseDialog.extendEvents({
    'click .js-back': '_openChangePrivacy'
  }),

  initialize: function() {
    if (!this.options.ChangePrivacyView) throw new Error('ChangePrivacyView is required');
    this.user = this.options.user;
    this.organization = this.user.organization;
    this.model = new ShareModel({
      vis: this.options.vis,
      organization: this.organization
    });
    this.elder('initialize');
    this._initViews();
    this._initBinds();
  },

  render: function() {
    BaseDialog.prototype.render.apply(this, arguments);
    this.$('.content').addClass('Dialog-content--expanded');
    return this;
  },

  // @implements cdb.ui.common.Dialog.prototype.render_content
  render_content: function() {
    return [
      this._htmlNode(
        cdb.templates.getTemplate('common/dialogs/change_privacy/share/share_header')({
          name: this.options.vis.get('name')
        })
      ),
      this._grantablesView.render().el,
      this._htmlNode(cdb.templates.getTemplate('common/dialogs/change_privacy/share/share_footer')())
    ];
  },

  // @implements cdb.ui.common.Dialog.prototype.ok
  ok: function() {
    var loadingView = ViewFactory.createDialogByTemplate('common/templates/loading', {
      title: 'Sharing…',
      quote: randomQuote()
    });
    loadingView.appendToBody();

    var permission = this.options.vis.permission;
    permission.overwriteAcl(this.model.get('permission'));
    permission.save()
      .always(function() {
        loadingView.close();
      })
      .fail(function() {
        var failView = ViewFactory.createDialogByTemplate('common/templates/fail', {
          msg: ''
        });
        failView.appendToBody();
      })
      .done(this._openChangePrivacy.bind(this));
  },

  _initViews: function() {
    var model = this.model;
    var grantables = this.organization.grantables;
    var pagedSearchModel = new PagedSearchModel({
      per_page: 50,
      order: 'name',
    });
    this._grantablesView = new PagedSearchView({
      isUsedInDialog: true,
      pagedSearchModel: pagedSearchModel,
      collection: grantables,
      createListView: function() {
        return new GrantablesView({
          model: model,
          collection: grantables,
          pagedSearchModel: pagedSearchModel
        })
      }
    });
  },

  _initBinds: function() {
    this.model.on('all', this._grantablesView.render, this._grantablesView);
  },

  _htmlNode: function(htmlStr) {
    return $(htmlStr)[0];
  },

  _openChangePrivacy: function() {
    var view = new this.options.ChangePrivacyView({
      clean_on_hide: true,
      enter_to_confirm: true,
      vis: this.options.vis,
      user: this.user
    });
    view.appendToBody();
    this.close();
  }

});
