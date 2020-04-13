const $ = require('jquery');
const CoreView = require('backbone/core-view');
const checkAndBuildOpts = require('builder/helpers/required-opts');
const PaginationView = require('builder/components/pagination/pagination-view.js');
const OrganizationUserView = require('./organization-user-view');

const REQUIRED_OPTS = [
  'userModel',
  'organization',
  'paginationModel'
];

module.exports = CoreView.extend({

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();

    this.$el.empty();

    // Users list
    const $ul = $('<ul>').addClass('OrganizationList');
    this.$el.append($ul);

    let totalPer = 0;
    this.collection.each(function (user) {
      // Calculations to create organization user bars
      const userPer = (user.get('quota_in_bytes') * 100) / this._organization.get('quota_in_bytes');
      const usedPer = (user.get('db_size_in_bytes') * 100) / this._organization.get('quota_in_bytes');
      user.organization = this._organization;

      const view = new OrganizationUserView({
        model: user,
        isOwner: user.isOrgOwner(),
        isAdmin: user.isOrgAdmin(),
        isViewer: user.get('viewer'),
        role: user.get('role_display'),
        editable: this._userModel.isOrgOwner() || this._userModel.id === user.id || !user.isOrgAdmin(),
        userPer: userPer,
        usedPer: usedPer,
        totalPer: totalPer,
        url: this._organization.viewUrl().edit(user)
      });

      $ul.append(view.render().el);
      this.addView(view);

      totalPer = totalPer + userPer;
    }, this);

    // Paginator
    const $paginatorWrapper = $('<div>').addClass('OrganizationList-paginator');
    this.$el.append($paginatorWrapper);
    const paginationView = new PaginationView({
      model: this._paginationModel
    });
    $paginatorWrapper.append(paginationView.render().el);
    this.addView(paginationView);

    return this;
  },

  _initBinds: function () {
    this.listenTo(this.collection, 'sync', this.render);
  }
});
