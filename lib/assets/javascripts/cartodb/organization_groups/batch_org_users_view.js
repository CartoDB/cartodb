var _ = require('underscore');
var cdb = require('cartodb.js');
var randomQuote = require('../common/view_helpers/random_quote');
var PaginationModel = require('../common/views/pagination/model');
var PaginationView = require('../common/views/pagination/view');
var GroupUsersView = require('./group_users_view');

/**
 * View to do some batch operation on a set of organization users.
 */
module.exports = cdb.core.View.extend({

  initialize: function() {
    _.each(['orgUsers'], function(name) {
      if (!this.options[name]) throw new Error(name + ' is required');
    }, this);

    this.options.orgUsers.setParameters({ per_page: 2 }); // TODO : for testing, rm
    this.pagination = new PaginationModel({
      per_page: this.options.orgUsers.getParameter('per_page'),
      current_page: this.options.orgUsers.getParameter('page'),
      total_count: this.options.orgUsers.getTotalUsers()
    });

    this.model = new cdb.core.Model({
      state: 'loading'
    });
    this._initBinds();

    this.options.orgUsers.fetch();
  },

  render: function() {
    this.clearSubViews();
    var html;
    var isDataLoaded = false;
    switch(this.model.get('state')) {
      case 'loading':
        html = this.getTemplate('common/templates/loading')({
          title: 'Loading users',
          quote: randomQuote()
        });
        break;
      case 'error':
        html = this.getTemplate('common/templates/fail')({
          msg: ''
        });
        break;
      default:
        html = this.getTemplate('organization_groups/batch_org_users')();
        isDataLoaded = true;
    }
    this.$el.html(html);
    if (isDataLoaded) {
      this._renderUsers();
      this._renderPagination();
    }
    return this;
  },

  _initBinds: function() {
    this.options.orgUsers.on('loading', this.model.set.bind(this.model, 'state', 'loading'), this);
    this.options.orgUsers.on('error', this.model.set.bind(this.model, 'state', 'error'), this);
    this.options.orgUsers.on('reset', this._onResetUsers, this);
    this.add_related_model(this.options.orgUsers);

    this.pagination.bind('change:current_page', this._fetchUsersForPage, this);
    this.add_related_model(this.pagination);

    this.model.on('change:state', this.render, this);
  },

  _onResetUsers: function(orgUsers) {
    this.pagination.set({
      total_count: orgUsers.getTotalUsers(),
      current_page: orgUsers.getParameter('page')
    });
    this.model.unset('state');
  },

  _fetchUsersForPage: function(pagination, newPage) {
    this.model.set('state', 'loading');
    this.options.orgUsers.setParameters({ page: newPage })
    this.options.orgUsers.fetch();
  },

  _renderUsers: function() {
    var usersView = new GroupUsersView({
      el: this.$('.js-users'),
      orgUsers: this.options.orgUsers
    })
    this.addView(usersView.render());
  },

  _renderPagination: function() {
    var paginationView = new PaginationView({
      el: this.$('.js-pagination'),
      model: this.pagination
    });
    this.addView(paginationView.render());
  }

});
