const $ = require('jquery');
const CoreView = require('backbone/core-view');
const Utils = require('builder/helpers/utils');
const checkAndBuildOpts = require('builder/helpers/required-opts');
const ModalsServiceModel = require('builder/components/modals/modals-service-model');
const PaginationModel = require('builder/components/pagination/pagination-model');
const template = require('./organization-users.tpl');
const OrganizationUsersFooterView = require('./organization-users-footer-view');
const DropdownAdminView = require('dashboard/components/dropdown/dropdown-admin-view');
const PagedSearchModel = require('dashboard/data/paged-search-model');
const TabPane = require('dashboard/components/tabpane/tabpane');
const InviteUsersDialogView = require('../invite-users/invite-users-dialog-view');
const addUsersTemplate = require('./add-users.tpl');
const OrganizationUsersListView = require('./organization-users-list-view');
const loadingView = require('builder/components/loading/render-loading');
const noResultsTemplate = require('builder/components/no-results/no-results.tpl');
const errorTemplate = require('dashboard/views/data-library/content/error-template.tpl');
const ViewFactory = require('builder/components/view-factory');

const REQUIRED_OPTS = [
  'userModel',
  'configModel',
  'organization',
  'organizationUsers'
];

/**
 *  Organization users content, list, pagination,
 *  form, footer...
 *
 */

module.exports = CoreView.extend({

  events: {
    'click .js-addUserOptions': '_openAddUserDropdown',
    'click .js-search-link': '_onSearchClick',
    'click .js-clean-search': '_onCleanSearchClick',
    'keydown .js-search-input': '_onKeyDown',
    'submit .js-search-form': 'killEvent'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._modals = new ModalsServiceModel();

    this.pagedSearchModel = new PagedSearchModel({
      per_page: 50,
      order: 'username'
    });

    this.paginationModel = new PaginationModel({
      current_page: this.pagedSearchModel.get('page'),
      total_count: this._organizationUsers.totalCount(),
      per_page: this.pagedSearchModel.get('per_page')
    });

    // Include current user in fetch results
    this._organizationUsers.excludeCurrentUser(false);

    this._initBinds();

    this.pagedSearchModel.fetch(this._organizationUsers);
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(
      template({
        seats: this._organization.get('seats'),
        assigned_seats: this._organization.get('assigned_seats'),
        viewer_seats: this._organization.get('viewer_seats'),
        assigned_viewer_seats: this._organization.get('assigned_viewer_seats'),
        newUserUrl: this._organization.viewUrl().create()
      })
    );

    this._initViews();

    return this;
  },

  _initBinds: function () {
    this.listenTo(this._organizationUsers, 'fetching', function () {
      this._panes && this._panes.active('loading');
    });

    this.listenTo(this._organizationUsers, 'error', function (error) {
      // Old requests can be stopped, so aborted requests are not
      // considered as an error
      if (!error || (error && error.statusText !== 'abort')) {
        this._panes.active('error');
      }
    });

    this.listenTo(this._organizationUsers, 'sync', function (collection) {
      const total = collection.totalCount();

      this.paginationModel.set({
        total_count: total,
        current_page: this.pagedSearchModel.get('page')
      });
      this._panes && this._panes.active(total > 0 ? 'users' : 'no_results');
    });

    this.listenTo(this._organizationUsers, 'sync error loading', function (collection) {
      this[this.pagedSearchModel.get('q') ? '_showCleanSearchButton' : '_hideCleanSearchButton']();
    });

    this.listenTo(this.paginationModel, 'change:current_page', function (model) {
      const newPage = model.get('current_page');

      this.pagedSearchModel.set('page', newPage);
      this.pagedSearchModel.fetch(this._organizationUsers);
    });

    $(document).on('click', '.js-inviteUser', this._onInviteClick.bind(this));
  },

  _initViews: function () {
    this._panes = new TabPane({
      el: this.$('.js-organizationUsersPanes')
    });
    this.addView(this._panes);

    this._panes.addTab('users',
      new OrganizationUsersListView({
        organization: this._organization,
        collection: this._organizationUsers,
        paginationModel: this.paginationModel,
        userModel: this._userModel
      }).render()
    );

    this._panes.addTab('error', ViewFactory.createByHTML(errorTemplate({
      msg: ''
    })).render());

    this._panes.addTab('no_results', ViewFactory.createByHTML(noResultsTemplate({
      icon: 'CDB-IconFont-defaultUser',
      title: 'Oh! No results',
      desc: 'Unfortunately we haven\'t found any user with these parameters'
    })).render());

    this._panes.addTab('loading', ViewFactory.createByHTML(loadingView({
      title: 'Getting users...'
    })).render());

    // Form footer
    const footer = new OrganizationUsersFooterView({
      model: this._organization,
      organizationUsers: this._organizationUsers,
      configModel: this._configModel
    });
    this.addView(footer);
    this.$el.append(footer.render().el);

    let activePane = 'loading';

    if (this._organizationUsers.totalCount() === 0) {
      activePane = 'no_results';
    } else if (this._organizationUsers.totalCount() > 0) {
      activePane = 'users';
    }

    this._panes.active(activePane);
  },

  _openAddUserDropdown: function (event) {
    if (this._dropdownView) this._dropdownView.clean();

    this._dropdownView = new DropdownAdminView({
      className: 'Dropdown border',
      target: $(event.target),
      width: 120,
      template: addUsersTemplate,
      vertical_position: 'down',
      horizontal_position: 'right',
      createUrl: this._organization.viewUrl().create(),
      tick: 'right'
    });

    $('body').append(this._dropdownView.render().el);

    this._dropdownView.on('onDropdownHidden', function () {
      this._dropdownView.clean();
    }, this);

    this._dropdownView.open(event);
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

    this.pagedSearchModel.fetch(this._organizationUsers);
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

    this.pagedSearchModel.fetch(this._organizationUsers);
  },

  _onInviteClick: function (event) {
    event.preventDefault();

    this._dropdownView.clean();

    this._modals.create((modalModel) => (
      new InviteUsersDialogView({
        configModel: this._configModel,
        organization: this._organization,
        organizationUsers: this._organizationUsers,
        modalModel
      })
    ));
  },

  clean: function () {
    this._organizationUsers.restoreExcludeCurrentUser();
    $(document).off('click', '.js-inviteUser', this._onInviteClick.bind(this));
    CoreView.prototype.clean.apply(this);
  }
});
