
  /**
   *  Necessary tasks for public dashboard view
   *
   */

  $(function() {

    // Public dashboard view
    var PublicDashboard = cdb.core.View.extend({
      
      el: document.body,

      events: {
        'click .map-wrapper':           '_onClickBackdrop',
        'click .avatar a':              '_onAvatarClick',
        'click':                        '_onClick'
      },

      initialize: function() {
        this.model = new cdb.open.AuthenticatedUser();
        this._initViews();
        this._initBinds();
        this.model.fetch();
      },

      _initBinds: function() {
        _.bindAll(this, '_onClick', '_onAvatarClick');
        this.model.bind('change', this._onUserLogged, this);
      },

      _initViews: function(e) {
        // Public header
        if (this.$('.cartodb-public-header').length > 0) {
          var header = new cdb.open.Header({
            el: this.$('.cartodb-public-header'),
            model: this.model,
            current_view: this._getCurrentView()
          });
          this.addView(header);
        }

        // Public visualizations
        if (this.options.visualizations && this.options.visualizations.length > 0) {
          var self = this;
          _.each(this.options.visualizations, function(url, i) {
            var options = {
              title:             false,
              header:            false,
              description:       false,
              search:            false,
              layer_selector:    false,
              text:              false,
              image:             false,
              shareable:         false,
              annotation:        false,
              zoom:              false,
              cartodb_logo:      false,
              scrollwheel:       false,
              slides_controller: false,
              legends:           false,
              time_slider:       false,
              loader:            false,
              sublayer_options:  url.layer_visibility,
              no_cdn:            self.options.no_cdn
            };

            cartodb.createVis('map_' + i , url.url, options);
          });
        }
      },

      // Get type of current view
      // - It could be, dashboard, table or visualization
      _getCurrentView: function() {
        var pathname = location.pathname;
        
        if (pathname.indexOf('/tables/') !== -1 ) {
          return 'table';
        }

        if (pathname.indexOf('/viz/') !== -1 ) {
          return 'visualization';
        }

        // Other case -> dashboard (datasets, visualizations,...)
        return 'dashboard';
      },

      _onUserLogged: function() {
        if (this.model.get('username') === this.options.user_name) {
          // Show edit button in datasets or visualizations
          this.$('.edit.button.grey').each(function(i,el){
            $(el).addClass('active')
          })
        }
      },

      _onClickBackdrop: function(e) {
        var $target = $(e.target);
        var $link = $target.closest('.map-wrapper').find('.title a');

        if (!$target.hasClass('edit')) {
          if (e) this.killEvent(e);
          window.location = $link.attr('href');  
        }
      },

      _onAvatarClick: function(e) {
        // If user is logged, visiting his/her own profile and click over any dataset,
        // send him/her to the private dashboard
        if (this.model.get('username') === this.options.user_name && this.model.get('urls').length > 0) {
          if (e) this.killEvent(e);
          window.location = this.model.get('urls')[0];
        }
      },

      _onClick: function() {
        cdb.god.trigger("closeDialogs");
      }

    });

    cdb.init(function() {
      cdb.templates.namespace = 'cartodb/';

      cdb.config.set('cartodb_com_hosted', cartodb_com_hosted);

      var public_dashboard = new PublicDashboard({
        no_cdn:         window.no_cdn,
        visualizations: window.visualizations,
        user_name:      window.user_name
      });
    });
  });
