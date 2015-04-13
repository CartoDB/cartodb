/**
 *  Entry point for organization pages
 */


$(function() {

  var Organization = cdb.core.View.extend({

    el: document.body,

    _PATHS: {
      organization:           '/organization',
      organization_user:      '/organization/users/<%- username %>/edit',
      new_organization_user:  '/organization/users/new',
    },

    events: {
      'click .pass-generator':          '_onGenerateClick',
      'click .disqus_help':             '_onDisqusClick',
      'click a#disconnectGoogleButton': '_showGoogleDialog',
      'click .flash .close':            '_onFlashClick'
    },

    initialize: function() {
      // Change paths with prefix url
      this._setPaths();
      // Init views
      this._initViews();
      // Init binds
      this._initBinds();
    },

    _setPaths: function() {
      var self = this;
      _.each(this._PATHS, function(value, key) {
        self._PATHS[key] = cdb.config.prefixUrl() + value;
      });
    },

    _initViews: function() {

      // User menu
      var user_menu = new cdb.admin.UserSettingsDropdown({
        target: $('a.account'),
        model: this.options.user,
        template_base: "common/views/settings_item"
      });

      cdb.god.bind("closeDialogs", user_menu.hide, user_menu);
      this.$el.append(user_menu.render().el);
      this.addView(user_menu);

      // Organization users list
      if (this.$('.content.users_list ul').length > 0) {
        var users_list = new cdb.admin.organization.UsersList({
          el: this.$('.content.users_list ul'),
          model: this.model,
          collection: this.collection,
          paths: this._PATHS
        });
        users_list.render();
        this.addView(users_list);
      }

      // Organization form
      if (this.$('form').length > 0) {
        var form = new cdb.admin.organization.Form({
          el: this.$('form'),
          model: this.model,
          collection: this.collection,
          user: this.options.organization_user,
          paths: this._PATHS
        });

        form.render();
        this.addView(form);
      }

      // User organization xtras
      if (this.$('form .extras').length > 0) {
        var extras = new cdb.admin.organization.Extras({
          el: this.$('form .extras')
        });
        extras.render();
        this.addView(extras);
      }

      // Add avatar in dropdown if user comes from an organization
      if (this.options.user.isInsideOrg()) {
        this.$('a.account.separator')
          .prepend($('<img>').attr('src', this.options.user.get('avatar_url')))
          .addClass('organization')
      }
    },

    _initBinds: function() {
      // bind all
      _.bindAll(this, '_onGenerateClick');
      // global click
      enableClickOut(this.$el);
    },

    _onDisqusClick: function(e) {
      this.killEvent(e);

      var disqus_dialog = new cdb.admin.DisqusDialog();

      disqus_dialog.appendToBody();
      disqus_dialog.open();
    },

    _showGoogleDialog: function(e) {
      this.killEvent(e);

      var google_dialog = new cdb.admin.GoogleDialog();

      google_dialog.appendToBody();
      google_dialog.open();
    },

    // Generate new password
    _onGenerateClick: function(e) {
      if (e) e.preventDefault();

      this.$('form input#user_confirm_password, form input#user_password')
        .val(cdb.Utils.genRandomPass());
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
    cdb.config.set(config);
    cdb.config.set('url_prefix', user_data.base_url);

    // Store JS errors
    var errors = new cdb.admin.ErrorStats({ user_data: window.user_data || {} });

    // Main view
    var organization = new Organization({
      model:              new cdb.core.Model(organization_quota),
      collection:         new cdb.admin.OrganizationUsers(organization_users),
      organization_user:  new cdb.admin.organization.User( window.organization_user_data || {} ),
      user:               new cdb.admin.User( window.user_data || {} )
    });
  });

});


cdb.admin.organization = cdb.admin.organization || {};
