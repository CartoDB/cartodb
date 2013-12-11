/**
 *  Entry point for organization pages
 */


$(function() {

    var Organization = cdb.core.View.extend({

      el: document.body,

      events: {
        'click': '_onClickOut'
      },

      initialize: function() {
        // Init views
        this._initViews();
      },

      _initViews: function() {

        // User menu
        var user_menu = new cdb.admin.DropdownMenu({
          target: $('a.account'),
          host: config.account_host,
          username: username,
          template_base: "common/views/settings_item"
        });

        cdb.god.bind("closeDialogs", user_menu.hide, user_menu);
        this.$el.append(user_menu.render().el);

        this.addView(user_menu);

        // Organization users
        var users_list = new cdb.admin.organization.Users({
          el: this.$('.content.user_list ul'),
          model: this.model,
          collection: this.collection
        });
        users_list.render();

        this.addView(users_list);
      },

      // Handle function for the god event
      _onClickOut: function(ev) {
        cdb.god.trigger("closeDialogs");
      }

    });


    cdb.init(function() {
      cdb.templates.namespace = 'cartodb/';
      var organization = new Organization({
        model: new cdb.core.Model(organization_quota),
        collection: new Backbone.Collection(organization_users)
      });
      // expose to debug
      window.organization = organization;
    });
});


cdb.admin.organization = cdb.admin.organization || {};