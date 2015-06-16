var cdb = require('cartodb.js');
var _ = require('underscore');
var $ = require('jquery');
var Utils = require('cdb.Utils');
var OrganizationUsersListView = require('./organization_users_list_view'); 
var OrganizationUsersFooterView = require('./organization_users_footer_view');
var PaginationModel = require('../../common/views/pagination/model');
var randomQuote = require('../../common/view_helpers/random_quote');
var ViewFactory = require('../../common/view_factory');

/** 
 *  Organization users content, list, pagination,
 *  form footer,...
 *
 */

module.exports = cdb.core.View.extend({

  events: {
    'click .js-search-link': '_onSearchClick',
    'click .js-clean-search': '_onCleanSearchClick',
    'keydown .js-search-input': '_onKeyDown',
    'submit .js-search-form': 'killEvent'
  },

  initialize: function() {
    this.organization = this.options.organization;
    this.organizationUsers = this.options.organizationUsers;
    this.paginationModel = new PaginationModel({
      current_page: this.organizationUsers.getParameter('page'),
      total_count: this.organizationUsers.getTotalUsers(),
      per_page: this.organizationUsers.getParameter('per_page')
    });
    this.template = cdb.templates.getTemplate('organization/organization_users/organization_users');
    this._initBinds();
    this.organizationUsers.fetch(); // Fetch fetch fetch!
  },

  render: function() {
    this.clearSubViews();
    this.$el.html(this.template());
    this._initViews();
    return this;
  },

  _initBinds: function() {
    this.organizationUsers.bind('loading', function() {
      this._panes && this._panes.active('loading');
    }, this);

    this.organizationUsers.bind('error', function(e) {
      // Old requests can be stopped, so aborted requests are not
      // considered as an error
      if (!e || (e && e.statusText !== "abort")) {
        this._panes.active('error');
      }
    }, this);

    this.organizationUsers.bind('reset', function(coll) {
      var total = coll.getTotalUsers();
      this.paginationModel.set({
        total_count: total,
        current_page: coll.getParameter('page')
      });
      this._panes && this._panes.active(total > 0 ? 'users' : 'no_results');
    }, this);

    this.organizationUsers.bind('reset error loading', function(coll) {
      this[ this.organizationUsers.getSearch() ? '_showCleanSearchButton' : '_hideCleanSearchButton' ]();
    }, this);

    this.paginationModel.bind('change:current_page', function(mdl) {
      var newPage = mdl.get('current_page');
      this.organizationUsers
        .setParameters({
          page: newPage
        })
        .fetch();
    }, this);

    // Bind for getting all users from the first request
    this.organizationUsers.bind('reset', this._setTotalUsers, this);
    
    this.add_related_model(this.organizationUsers);
    this.add_related_model(this.paginationModel);
  },

  _setTotalUsers: function() {
    this.organization.set('total_users', this.organizationUsers.getTotalUsers());
    this.organizationUsers.unbind('reset', this._setTotalUsers, this);
  },

  _initViews: function() {
    // Panes
    this._panes = new cdb.ui.common.TabPane({
      el: this.$('.js-organizationUsersPanes')
    });
    this.addView(this._panes);
    
    this._panes.addTab('users',
      new OrganizationUsersListView({
        organization: this.organization,
        collection: this.organizationUsers,
        paginationModel: this.paginationModel
      }).render()
    );

    this._panes.addTab('error',
      ViewFactory.createByTemplate('common/templates/fail', {
        msg: ''
      }).render()
    );

    this._panes.addTab('no_results',
      ViewFactory.createByTemplate('common/templates/no_results', {
        icon: 'iconFont-DefaultUser',
        title: 'Oh! No results',
        msg: 'Unfortunately we haven\'t found any user with these parameters'
      }).render()
    );

    this._panes.addTab('loading',
      ViewFactory.createByTemplate('common/templates/loading', {
        title: 'Getting users…',
        quote: randomQuote()
      }).render()
    );

    // Form footer
    var footer = new OrganizationUsersFooterView({
      model: this.organization
    });
    this.$el.append(footer.render().el);

    var activePane = 'loading';
    if (this.organizationUsers.getTotalUsers() === 0) {
      activePane = 'no_results';
    } else if (this.organizationUsers.getTotalUsers() > 0) {
      activePane = 'users';
    }
    
    this._panes.active(activePane);
  },

  _showCleanSearchButton: function() {
    this.$('.js-clean-search').show();
  },

  _hideCleanSearchButton: function() {
    this.$('.js-clean-search').hide();
  },

  _focusSearchInput: function() {
    var $searchInput = this.$('.js-search-input');
    $searchInput.focus().val($searchInput.val());
  },

  _onSearchClick: function(e) {
    if (e) this.killEvent(e);
    this.$('.js-search-input').focus();
  },

  _onCleanSearchClick: function(ev) {
    this.killEvent(ev);
    this._cleanSearch();
  },

  _onKeyDown: function(ev) {
    var enterPressed = (ev.keyCode == $.ui.keyCode.ENTER);
    var escapePressed = (ev.keyCode == $.ui.keyCode.ESCAPE);
    if (enterPressed) {
      this.killEvent(ev);
      this._submitSearch();
    } else if (escapePressed) {
      this.killEvent(ev);
      if (this.organizationUsers.getSearch()) {
        this._cleanSearch();  
      }
    }
  },

  _submitSearch: function(e) {
    var search = this.$('.js-search-input').val().trim();
    this.organizationUsers
      .setParameters({
        q: Utils.stripHTML(search),
        page: 1
      })
      .fetch();
  },

  _cleanSearch: function() {
    this.$('.js-search-input').val('');
    this.organizationUsers
      .setParameters({
        q: '',
        page: 1
      })
      .fetch();
  }

});