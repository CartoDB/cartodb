  
  /**
   *  Dashboard welcome when there is no tables in
   *  user account.
   *
   *  - It doesn't need any model.
   *  - It just plays showing some videos.
   *
   *  new cdb.admin.WelcomeView({ el: $('wherever') })
   */


  cdb.admin.WelcomeView = cdb.core.View.extend({

    events: {
      'click a.locked': '_onClickLockedTables',
      'click ul li a':  '_onClickVideo'
    },

    _videos: {
      import: {
        url:'80472124'
      },
      customize: {
        url:'80472012'
      },
      publish: {
        url:'80472123'
      },
    },

    video_template: '<iframe id="video" src="https://player.vimeo.com/video/<%- url %>?api=1&amp;player_id=video" width="100%" height="100%" frameborder="0" webkitallowfullscreen="" mozallowfullscreen="" allowfullscreen=""></iframe>',

    initialize: function() {
      this.template = cdb.templates.getTemplate('dashboard/views/welcome_view');

      this.tables = this.options.tables;
      this.user = this.options.user;
      this.router = this.options.router;
      this.model = new cdb.core.Model({
        option: 'import',
        locked_tables: 0
      });

      this._generateLockTables();

      this._initBinds();
    },

    render: function() {
      // Render html
      this.$el.html(this.template( this.model.attributes ));
      // Select current video
      this._selectVideo(this.model.get('option'));

      return this;
    },

    _initBinds: function() {
      _.bindAll(this, '_onClickLockedTables');
      this.model.bind('change:locked_tables', this.render, this);
      this.tables.bind('reset add remove', this._onTablesChange, this);
      this.add_related_model(this.tables);
    },

    // Generate locked tables model
    _generateLockTables: function() {
      // There is no info about how many lock tables user has in this account
      // so we need to make a request to the visualizations endpoint and check
      // if there is any and show the link at the bottom.
      this.locked_vis_clone = new cdb.admin.Visualizations();

      this.locked_vis_clone.options.set({
        locked:         true,
        exclude_shared: true,
        page:           1,
        per_page:       1,
        q:              '',
        tags:           '',
        type:           "table"
      });
    },

    _checkLockTables: function() {
      var self = this;
      this.locked_vis_clone.fetch({
        success: function(r) {
          if (r.total_entries) {
            self.model.set('locked_tables', r.total_entries);
          }
        },
        error: function() {
          cdb.log.info('Fetching lock tables failed')
        }
      })
    },

    _onTablesChange: function() {
      if (this.tables.total_entries === 0 && this.router.model.get('model') === "tables") {
        this._checkLockTables();
      }
    },

    ///////////////////
    // Change option //
    ///////////////////

    _onClickVideo: function(e) {
      e.preventDefault();
      var $a = $(e.target).closest('a');
      var href = $a.attr('href').replace(/#\//,'');
      this._goTo($a, href);
    },

    _goTo: function($el, pos) {
      if (this.model.get('option') == pos) return false;

      this.model.set('option', pos);
      this._selectOption($el,pos);
      this._selectVideo(pos);
    },

    _selectOption: function($el, pos) {
      this.$('ul li a').each(function(i,a) {
        var href = $(a).attr('href').replace(/#\//,'');
        $(a)[href == pos ? 'addClass' : 'removeClass' ]('selected');
      })
    },

    _selectVideo: function(pos) {
      // Remove old video
      this.$('.iframe')
        .html(_.template(this.video_template)({ url: this._videos[pos].url }))
    },

    _onClickLockedTables: function(e) {
      if (e) this.killEvent(e);
      this.router.navigate('/tables/locked', { trigger: true })
    },


    ////////////////////
    // View functions //
    ////////////////////

    activate: function() {
      this.$el.addClass('active')
    },

    deactivate: function() {
      this.$el.removeClass('active')
    }

  });