const _ = require('underscore');
const $ = require('jquery');
const Backbone = require('backbone');
const CoreView = require('backbone/core-view');
const PagedSearchView = require('dashboard/components/paged-search/paged-search-view');
const PagedSearchModel = require('dashboard/data/paged-search-model');
const template = require('./add-group-users-view.tpl');
const loadingTemplate = require('builder/components/loading/loading.tpl');
const errorTemplate = require('dashboard/views/data-library/content/error-template.tpl');
const randomQuote = require('builder/components/loading/random-quote');
const GroupUsersListView = require('dashboard/views/organization/groups-admin/group-users-list/group-users-list-view');

const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'group',
  'orgUsers',
  'modalModel'
];

/**
 * Dialog to add custom basemap to current map.
 */
module.exports = CoreView.extend({
  events: {
    'click .ok': 'ok'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    CoreView.prototype.initialize.apply(this);
    this.model = new Backbone.Model();

    // Include current user in fetch results
    this._orgUsers.excludeCurrentUser(false);

    this._initBinds();
    this._initViews();
  },

  clean: function () {
    // restore org users
    this._orgUsers.restoreExcludeCurrentUser();
    CoreView.prototype.clean.apply(this);
  },

  /**
   * @override cdb.ui.common.Dialog.prototype.render
   */
  render: function () {
    this.$el.html(this.render_content());
    this.$el.addClass('Dialog-contentWrapper');
    this._onChangeSelected();
    return this;
  },

  /**
   * @implements cdb.ui.common.Dialog.prototype.render_content
   */
  render_content: function () {
    switch (this.model.get('state')) {
      case 'saving':
        return loadingTemplate({
          title: 'Adding users to group',
          descHTML: randomQuote()
        });
      case 'saveFail':
        return errorTemplate({
          msg: ''
        });
      default:
        const $content = $(template());
        $content.find('.js-dlg-body').replaceWith(this._PagedSearchView.render().el);
        return $content;
    }
  },

  ok: function () {
    const selectedUsers = this._selectedUsers();

    if (selectedUsers.length > 0) {
      this.model.set('state', 'saving');

      var ids = _.pluck(selectedUsers, 'id');

      this._group.users.addInBatch(ids)
        .done(() => {
          this._group.users.add(selectedUsers);
          this._modalModel.destroy();
        })
        .fail(() => {
          this.model.set('state', 'saveFail');
        });
    }
  },

  _initViews: function () {
    this._PagedSearchView = new PagedSearchView({
      isUsedInDialog: true,
      pagedSearchModel: new PagedSearchModel({
        per_page: 50,
        order: 'username'
      }),
      collection: this._orgUsers,
      createListView: this._createUsersListView.bind(this)
    });

    this.addView(this._PagedSearchView);
  },

  _createUsersListView: function () {
    return new GroupUsersListView({
      users: this._orgUsers
    });
  },

  _initBinds: function () {
    this.listenTo(this._orgUsers, 'change:selected', this._onChangeSelected);
    this.listenTo(this.model, 'change:state', this.render);
  },

  _onChangeSelected: function () {
    this.$('.ok').toggleClass('is-disabled', this._selectedUsers().length === 0);
  },

  _selectedUsers: function () {
    return this._orgUsers.where({ selected: true });
  }
});
