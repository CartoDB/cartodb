
    /**
     *  Widget for displaying last posts from blog
     */

    
    // Model to get last posts from specified service
    cdb.admin.PostsModel = cdb.core.Model.extend({

      defaults: {
        url:      "//<%- name %>.com/<%- service %>-feed.json",
        service:  "blog",
        name:     "cartodb"
      },

      url: function() {
        return _.template(this.defaults.url)({
          service:  this.get('service'),
          name:     this.get('name'),
          api_key:  config[this.get('service') + '_api_key']
        })
      },

      parse: function(r) {
        var obj = this.toJSON();
        obj.posts = r.posts;
        return obj;
      }

    });


  
    cdb.admin.PostsWidget = cdb.core.View.extend({

      tagName:    'em',
      className:  'posts',

      _STORAGE_KEY: 'cartodb.visit_news',

      _TEXTS: {
        news: _t('new!')
      },

      events: {
        'click': '_showLastPosts'
      },

      initialize: function() {
        _.bindAll(this, '_showLastPosts');
        this.model = new cdb.admin.PostsModel();
        this.visualizations = this.options.visualizations;
        this.tables = this.options.tables;
        this._initBinds();
        this.storage = new cdb.admin.localStorage(this._STORAGE_KEY);
      },

      render: function() {
        this.$el.append(this._TEXTS.news);
        return this;
      },

      _showLastPosts: function(e) {
        if (e) this.killEvent(e);

        if (this.dropdown) this.dropdown.clean();

        this.dropdown = new cdb.admin.DropdownMenu({
          className: 'dropdown border posts_widget',
          target: this.$el,
          width: 238,
          speedIn: 150,
          speedOut: 300,
          template_base: 'dashboard/views/dashboard_posts_widget_view',
          vertical_position: "down",
          horizontal_position: "left",
          horizontal_offset: -92,
          vertical_offset: -5,
          clean_on_hide: true,
          tick: "center",
          posts: this.model.get('posts') || []
        });

        $('body').append(this.dropdown.render().el);
        this.dropdown.open(e);
        cdb.god.bind("closeDialogs", this.dropdown.hide, this.dropdown);

        // Remove news class and set storage!
        this.$el.removeClass('news');
        this.storage.set(new Date().getTime());
      },

      _fetchPosts: function() {
        this._destroyBinds();
        this.model.fetch({
          dataType:       'jsonp',
          jsonpCallback:  'callback'
        });
      },

      show: function() {
        if (this.model.get('posts') && this.model.get('posts').length > 0) {

          if (this._isThereNews()) {
            this.$el.addClass('news')
          }

          this.$el.css({
            display:  'block',
            top:      '-8px',
            opacity:  0
          })
          .animate({
            top:    -2,
            opacity:1
          }, 400);
        }
      },

      _isThereNews: function() {
        // Check local storage
        var value = this.storage.get();

        if (value && !_.isArray(value)) {
          var time_first_post = this.model.get('posts')[0].timestamp;
          if (time_first_post && new Date(time_first_post*1000) > new Date(value)) {
            return true
          } else {
            return false
          }
        } else {
          return true; 
        }
      },

      _destroyBinds: function() {
        this.tables.unbind('reset',         null, this);
        this.visualizations.unbind("reset", null, this);
      },

      _initBinds: function() {
        this.tables.bind('reset',         this._fetchPosts, this);
        this.visualizations.bind("reset", this._fetchPosts, this);
        this.model.bind('change',         this.show,          this);
      }

    });