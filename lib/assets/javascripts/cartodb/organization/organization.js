/**
 *  Entry point for organization pages
 */


$(function() {

  var Organization = cdb.core.View.extend({

    el: document.body,

    events: {
      'click .flash .close':  '_onFlashClick'
    },

    initialize: function() {
      // Init views
      this._initViews();
      // Init binds
      this._initBinds();
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
      if (this.$('.content.users_list ul').length > 0) {
        var users_list = new cdb.admin.organization.UsersList({
          el: this.$('.content.users_list ul'),
          model: this.model,
          collection: this.collection
        });
        users_list.render();
        this.addView(users_list);
      }

      // Quota progress bars
      if (this.$('aside.organization_quota').length > 0) {
        var quotas = new cdb.admin.organization.Quotas({
          el: this.$('aside.organization_quota'),
          model: this.model,
          collection: this.collection
        })
        quotas.render();
        this.addView(quotas);
      }

      // Organization form
      if (this.$('form').length > 0) {
        var form = new cdb.admin.organization.Form({
          el: this.$('form'),
          model: this.model,
          collection: this.collection,
          user: this.options.user
        })

        form.render();
        this.addView(form);
      }
    },

    _initBinds: function() {
      // global click
      enableClickOut(this.$el);
    },

    // Handle function for the god event
    _onFlashClick: function(e) {
      if (e) e.preventDefault();

      var $flash = $(e.target).closest('li.flash');
      $flash.slideUp();
    }

  });


  cdb.init(function() {
    cdb.templates.namespace = 'cartodb/';
    var organization = new Organization({
      model: new cdb.core.Model(organization_quota),
      collection: new Backbone.Collection(organization_users),
      user: new cdb.admin.organization.User( window.user_data || {} )
    });
    // expose to debug
    window.organization = organization;
  });
});


cdb.admin.organization = cdb.admin.organization || {};