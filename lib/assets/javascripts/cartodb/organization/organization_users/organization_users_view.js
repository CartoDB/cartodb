var cdb = require('cartodb.js-v3');
var $ = require('jquery-cdb-v3');
var Utils = require('cdb.Utils');
var OrganizationUsersListView = require('./organization_users_list_view');
var OrganizationUsersFooterView = require('./organization_users_footer_view');
var PagedSearchModel = require('../../common/paged_search_model');
var PaginationModel = require('../../common/views/pagination/model');
var randomQuote = require('../../common/view_helpers/random_quote');
var ViewFactory = require('../../common/view_factory');
var InviteUsersDialogView = require('../invite_users/invite_users_dialog_view');

/**
 *  Organization users content, list, pagination,
 *  form footer,...
 *
 */

module.exports = cdb.core.View.extend({

  events: {
    'click .js-addUserOptions': '_openAddUserDropdown',
    'click .js-search-link': '_onSearchClick',
    'click .js-clean-search': '_onCleanSearchClick',
    'keydown .js-search-input': '_onKeyDown',
    'submit .js-search-form': 'killEvent'
  },

  initialize: function () {
    this.organization = this.options.organization;
    this.organizationUsers = this.options.organizationUsers;
    this.currentUser = this.options.currentUser;
    this.pagedSearchModel = new PagedSearchModel({
      per_page: 50,
      order: 'username'
    });
    this.paginationModel = new PaginationModel({
      current_page: this.pagedSearchModel.get('page'),
      total_count: this.organizationUsers.totalCount(),
      per_page: this.pagedSearchModel.get('per_page')
    });
    this.template = cdb.templates.getTemplate('organization/organization_users/organization_users');
    this._initBinds();
    this.pagedSearchModel.fetch(this.organizationUsers);
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(
      this.template({
        seats: this.organization.get('seats'),
        assigned_seats: this.organization.get('assigned_seats'),
        viewer_seats: this.organization.get('viewer_seats'),
        assigned_viewer_seats: this.organization.get('assigned_viewer_seats'),
        newUserUrl: this.organization.viewUrl().create()
      })
    );
    this._initViews();
    return this;
  },

  _initBinds: function () {
    this.organizationUsers.bind('fetching', function () {
      this._panes && this._panes.active('loading');
    }, this);

    this.organizationUsers.bind('error', function (e) {
      // Old requests can be stopped, so aborted requests are not
      // considered as an error
      if (!e || (e && e.statusText !== 'abort')) {
        this._panes.active('error');
      }
    }, this);

    this.organizationUsers.bind('reset', function (coll) {
      var total = coll.totalCount();
      this.paginationModel.set({
        total_count: total,
        current_page: this.pagedSearchModel.get('page')
      });
      this._panes && this._panes.active(total > 0 ? 'users' : 'no_results');
    }, this);

    this.organizationUsers.bind('reset error loading', function (coll) {
      this[ this.pagedSearchModel.get('q') ? '_showCleanSearchButton' : '_hideCleanSearchButton' ]();
    }, this);

    this.paginationModel.bind('change:current_page', function (mdl) {
      var newPage = mdl.get('current_page');
      this.pagedSearchModel.set('page', newPage);
      this.pagedSearchModel.fetch(this.organizationUsers);
    }, this);

    this.add_related_model(this.organizationUsers);
    this.add_related_model(this.paginationModel);
  },

  _initViews: function () {
    this._panes = new cdb.ui.common.TabPane({
      el: this.$('.js-organizationUsersPanes')
    });
    this.addView(this._panes);

    this._panes.addTab('users',
      new OrganizationUsersListView({
        organization: this.organization,
        collection: this.organizationUsers,
        paginationModel: this.paginationModel,
        currentUser: this.currentUser
      }).render()
    );

    this._panes.addTab('error',
      ViewFactory.createByTemplate('common/templates/fail', {
        msg: ''
      }).render()
    );

    this._panes.addTab('no_results',
      ViewFactory.createByTemplate('common/templates/no_results', {
        icon: 'CDB-IconFont-defaultUser',
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
      model: this.organization,
      organizationUsers: this.organizationUsers
    });
    this.addView(footer);
    this.$el.append(footer.render().el);

    var activePane = 'loading';
    if (this.organizationUsers.totalCount() === 0) {
      activePane = 'no_results';
    } else if (this.organizationUsers.totalCount() > 0) {
      activePane = 'users';
    }

    this._panes.active(activePane);
  },

  _openAddUserDropdown: function (e) {
    var self = this;
    this.killEvent(e);

    if (this.dropdown) {
      this._closeDropdown();
      return;
    }

    this.dropdown = new cdb.admin.DropdownMenu({
      className: 'Dropdown border',
      target: $(e.target),
      width: 120,
      template_base: 'organization/organization_users/add_users_template',
      vertical_position: 'down',
      horizontal_position: 'right',
      horizontal_offset: 0,
      vertical_offset: -10,
      createUrl: this.organization.viewUrl().create(),
      tick: 'right'
    });

    this.dropdown.bind('optionClicked', function (ev) {
      var $target = $(ev.target);
      if ($target.hasClass('js-inviteUser')) {
        ev.preventDefault();
        this._onInviteClick();
      }
    }, this);

    $('body').append(this.dropdown.render().el);
    cdb.god.bind('closeDialogs', function () {
      self._closeDropdown();
    }, this.dropdown);

    this.dropdown.open(e);
  },

  _closeDropdown: function () {
    if (this.dropdown) {
      var self = this;
      cdb.god.unbind(null, null, this.dropdown);
      this.dropdown.hide(function () {
        self.dropdown.clean();
        delete self.dropdown;
      });
    }
  },

  _showCleanSearchButton: function () {
    this.$('.js-clean-search').show();
  },

  _hideCleanSearchButton: function () {
    this.$('.js-clean-search').hide();
  },

  _focusSearchInput: function () {
    var $searchInput = this._$searchInput();
    $searchInput.focus().val($searchInput.val());
  },

  _onSearchClick: function (e) {
    if (e) this.killEvent(e);
    this._$searchInput().focus();
  },

  _onCleanSearchClick: function (ev) {
    this.killEvent(ev);
    this._cleanSearch();
  },

  _onKeyDown: function (ev) {
    var enterPressed = (ev.keyCode === $.ui.keyCode.ENTER);
    var escapePressed = (ev.keyCode === $.ui.keyCode.ESCAPE);
    if (enterPressed) {
      this.killEvent(ev);
      this._submitSearch();
    } else if (escapePressed) {
      this.killEvent(ev);
      if (this.pagedSearchModel.get('q')) {
        this._cleanSearch();
      }
    }
  },

  _submitSearch: function (e) {
    var search = this._$searchInput().val().trim();
    this.pagedSearchModel.set({
      q: Utils.stripHTML(search),
      page: 1
    });

    this.pagedSearchModel.fetch(this.organizationUsers);
  },

  _$searchInput: function () {
    return this.$('.js-search-input');
  },

  _cleanSearch: function () {
    this._$searchInput().val('');
    this.pagedSearchModel.set({
      q: '',
      page: 1
    });

    this.pagedSearchModel.fetch(this.organizationUsers);
  },

  _onInviteClick: function () {
    this.dialog = new InviteUsersDialogView({
      clean_on_hide: true,
      enter_to_confirm: false,
      organization: this.organization,
      organizationUsers: this.organizationUsers
    }).appendToBody();
  }

});
