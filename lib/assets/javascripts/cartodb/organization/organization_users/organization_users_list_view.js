var cdb = require('cartodb.js');
var _ = require('underscore');
var $ = require('jquery');
var Utils = require('cdb.Utils');
var PaginationView = require('../../common/views/pagination/view');
var OrganizationUserView = require('./organization_user_view');
var ViewFactory = require('../../common/view_factory');

/**
 *  Organization users list 
 *
 */

module.exports = cdb.core.View.extend({

  initialize: function() {
    this.organization = this.options.organization;
    this.paginationModel = this.options.paginationModel;
    this._initBinds();
  },

  render: function() {
    this.clearSubViews();

    this.$el.empty();

    // Users list
    var $ul = $('<ul>').addClass('OrganizationList');
    this.$el.append($ul);
    var totalPer = 0;
    this.collection.each(function(user) {
      // Calculations to create organization user bars
      var userPer = (user.get('quota_in_bytes') * 100) / this.organization.get('quota_in_bytes');
      var usedPer = (user.get('db_size_in_bytes') * 100) / this.organization.get('quota_in_bytes');

      var v = new OrganizationUserView({
        model: user,
        isOwner: this.organization.get('owner').id === user.get('id'),
        userPer: userPer,
        usedPer: usedPer,
        totalPer: totalPer,
        url: this.organization.viewUrl().edit(user)
      });

      $ul.append(v.render().el);
      this.addView(v);

      totalPer = totalPer + userPer
    }, this);

    // Create new user block
    if (!this.collection.getSearch()) {
      var v = ViewFactory.createByTemplate('organization/organization_users/organization_new_user', {
        newUserUrl: this.organization.viewUrl().create()
      });
      $ul.append(v.render().el);
      this.addView(v);
    }

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

  _initBinds: function() {
    this.collection.bind('reset', this.render, this);
    this.add_related_model(this.collection);
  }

})