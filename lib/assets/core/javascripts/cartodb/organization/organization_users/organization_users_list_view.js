var cdb = require('cartodb.js-v3');
var $ = require('jquery-cdb-v3');
var PaginationView = require('../../common/views/pagination/view');
var OrganizationUserView = require('./organization_user_view');

module.exports = cdb.core.View.extend({

  initialize: function () {
    this.organization = this.options.organization;
    this.paginationModel = this.options.paginationModel;
    this.currentUser = this.options.currentUser;
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();

    this.$el.empty();

    // Users list
    var $ul = $('<ul>').addClass('OrganizationList');
    this.$el.append($ul);
    var totalPer = 0;
    this.collection.each(function (user) {
      // Calculations to create organization user bars
      var userPer = (user.get('quota_in_bytes') * 100) / this.organization.get('quota_in_bytes');
      var usedPer = (user.get('db_size_in_bytes') * 100) / this.organization.get('quota_in_bytes');
      user.organization = this.organization;

      var v = new OrganizationUserView({
        model: user,
        isOwner: user.isOrgOwner(),
        isAdmin: user.isOrgAdmin(),
        isViewer: user.get('viewer'),
        editable: this.currentUser.isOrgOwner() || this.currentUser.id === user.id || !user.isOrgAdmin(),
        userPer: userPer,
        usedPer: usedPer,
        totalPer: totalPer,
        url: this.organization.viewUrl().edit(user)
      });

      $ul.append(v.render().el);
      this.addView(v);

      totalPer = totalPer + userPer;
    }, this);

    // Paginator
    var $paginatorWrapper = $('<div>').addClass('OrganizationList-paginator');
    this.$el.append($paginatorWrapper);
    var paginationView = new PaginationView({
      model: this.paginationModel
    });
    $paginatorWrapper.append(paginationView.render().el);
    this.addView(paginationView);

    return this;
  },

  _initBinds: function () {
    this.collection.bind('reset', this.render, this);
    this.add_related_model(this.collection);
  }
});
