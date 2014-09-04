/**
 *  Entry point for common data
 */

 
$(function() {

  var CommonData = cdb.core.View.extend({

    el: document.body,

    events: {
      'click header ul.right li:eq(2) a': '_onCommonDataClick'
    },

    initialize: function() {
      this.user = new cdb.admin.User(this.options.user_data);
      this.tables = new cdb.admin.CommonData.Collection();
      this.tags = new cdb.admin.CommonData.TagsCollection();
      this.router = this.options.router;

      this._initViews();
      this._initBinds();

      this.tables.fetch();
    },

    _initBinds: function() {
      _.bindAll(this, '_onCommonDataClick');
      this.tables.bind('reset', this._onTablesFeched, this);
      this.add_related_model(this.tables);
      this.router.model.bind('change', this._onRouterChange, this);
      this.add_related_model(this.router.model);
    },

    _initViews: function() {
      // User menu
      var user_menu = this.user_menu = new cdb.admin.UserSettingsDropdown({
        target:         $('a.account'),
        model:          this.user,
        template_base:  'common/views/settings_item'
      });
      cdb.god.bind("closeDialogs", user_menu.hide, user_menu);
      this.$el.append(this.user_menu.render().el);

      // Add avatar in dropdown if user comes from an organization
      if (this.user.isInsideOrg()) {
        this.$('a.account.separator')
          .prepend($('<img>').attr('src', this.user.get('avatar_url')))
          .addClass('organization')
      }

      // Background Importer
      var bkg_importer = this.bkg_importer = new cdb.ui.common.BackgroundImporter({
        template_base: 'common/views/background_importer'
      });
      this.$el.append(this.bkg_importer.render().el);

      // Create new table view
      var createTable = this.createTable = new cdb.admin.CreateTable({
        el:       this.$el,
        importer: this.bkg_importer,
        model:    this.user,
        config:   cdb.config.toJSON()
      });

      // Loader
      var loader = new cdb.admin.CommonData.Loader({
        el:         this.$('.main_loader'),
        collection: this.tables,
        router:     this.router
      });

      this.addView(loader);

      // Empty block
      var empty = new cdb.admin.CommonData.Empty({
        el:         this.$('.empty'),
        collection: this.tables
      });

      this.addView(empty);

      // Aside
      var aside = new cdb.admin.CommonData.Aside({
        el:         this.$('aside'),
        collection: this.tags,
        router:     this.router
      });

      this.addView(aside);

      // Tables
      var tables_view = new cdb.admin.CommonData.Content({
        el:         this.$('section.tables'),
        collection: this.tables,
        tags:       this.tags,
        router:     this.router
      });

      tables_view.bind('tableChosen', function(url, v) {
        this.createTable._showDialog(null, null, url);
      }, this);
      this.addView(tables_view);

      // global click
      enableClickOut(this.$el);
    },

    _onTablesFeched: function() {
      var self = this;

      this.tags.comparator = function(tag) {
        return -tag.get("count");
      };

      // Get unique tags
      var arr =
        _.compact(
          this.tables.map(function(t) {
            if (t.get('tags').length > 0) {
              return t.get('tags')[0]
            }
            return null
          })
        );

      // Get tags count and generate obj
      var obj = {}
      _.each(arr, function(t) {
        if (!obj[t]) {
          obj[t] = 1
        } else {
          obj[t] = obj[t] + 1          
        }
      });

      // Reset tags collection
      this.tags.reset(
        _.map(obj, function(count, tag) {
          return {
            value:    tag,
            selected: self.router.model.get('tag') === tag ? true : false,
            count:    count
          }
        })
      );
    },

    _onRouterChange: function() {
      var self = this;

      // Set selected state for tags collection
      this.tags.each(function(tag) {
        if (tag.get('value') === self.router.model.get('tag')) {
          tag.set('selected', true)
        } else {
          tag.set('selected', false)
        }
      });
    },

    _onCommonDataClick: function(e) {
      if (e) e.preventDefault();
      this.router.navigate('/', { trigger: true });
    }

  });



  cdb.init(function() {

    cdb.templates.namespace = 'cartodb/';
    cdb.config.set(config);

    if (cdb.config.isOrganizationUrl()) {
      cdb.config.set('url_prefix', cdb.config.organizationUrl());
    }

    // Store JS errors
    var errors = new cdb.admin.ErrorStats({ user_data: user_data });

    // Common data router
    var router = new cdb.admin.CommonData.Router();

    // Main view
    var common_data = new CommonData({
      user_data:  user_data,
      router:     router
    });

    // Mixpanel test
    if (window.mixpanel)
      new cdb.admin.Mixpanel({
        user: user_data,
        token: mixpanel_token
      });

    Backbone.history.start({
      pushState:  true,
      root:       cdb.config.prefixUrl() + '/dashboard/common_data/'
    })
  });

});
