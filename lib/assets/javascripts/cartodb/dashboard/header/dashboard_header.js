
  /**
   *  Dashboard header view
   *
   *  - Controls header links
   *  - User options dropdown
   *
   *  new cdb.admin.DashboardHeader({
   *    router: backbone_router,
   *    user:   user_model,
   *    tables: tables_collection,
   *    visualizations: visualizations_collection
   *  })
   *
   */

  cdb.admin.DashboardHeader = cdb.core.View.extend({

    events: {
      'click li a.visualizations, li a.tables': '_onClickView'
    },

    initialize: function() {
      this.router = this.options.router;
      this.user = this.options.user;

      this._initViews();
      this._initBinds();
      this._selectView();
    },

    _initViews: function() {
      // User menu dropdown
      var user_menu = new cdb.admin.UserSettingsDropdown({
        target:         this.$('a.account'),
        model:          this.user,
        template_base:  'common/views/settings_item'
      });

      this.addView(user_menu);
      cdb.god.bind("closeDialogs", user_menu.hide, user_menu);
      $('body').append(user_menu.render().el);

      // Post notification widget
      var posts_widget = new cdb.admin.PostsWidget({
        tables:         this.options.tables,
        visualizations: this.options.visualizations
      });
      this.$('h1').append(posts_widget.render().el);
      this.addView(posts_widget);

      // Add avatar in dropdown if user comes from an organization
      if (this.user.isInsideOrg()) {
        this.$('a.account.separator')
          .prepend($('<img>').attr('src', this.user.get('avatar_url')))
          .addClass('organization')
      }
    },

    _initBinds: function() {
      this.router.model.bind('change', this._selectView, this);
      this.add_related_model(this.router.model);
    },

    _onClickView: function(e) {
      this.killEvent(e);
      var goTo = $(e.target).hasClass('tables') ? 'tables' : 'visualizations';
      this.router.navigate(goTo, { trigger: true });
    },

    _selectView: function() {
      var name = this.router.model.get('model');
      if (name) {
        this.$("a").removeClass("selected");
        this.$("." + name).addClass("selected");  
      }
      
    }

  })