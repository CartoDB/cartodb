
  /**
   *  Visualizations list
   */

  cdb.admin.dashboard.VisualizationsList = cdb.core.View.extend({

    initialize: function() {
      this.collection.bind('add remove reset', this.render, this);
    },

    render: function() {
      this.clearSubViews();
      var self = this;

      this.collection.each(function(vis) {
        if (vis.get("type") != "table") {
          var item = new cdb.admin.dashboard.VisualizationItem({
            model: vis,
            user: self.options.user
          })
          .bind('remove', function() {
            this.model.destroy();
          });

          self.$el.append(item.render().el);
          self.addView(item);
        }
      });

      this._addPlaceholders();

    },

    /*
     * Add empty visualizations placeholders
     * */
    _addPlaceholders: function() {

      var n = this.collection.size();

      if (n % 3 != 0) {

        var emptyVisNum = 3 - (n % 3);

        for (var i = 0; i < emptyVisNum; i++) {
          var item = new cdb.admin.dashboard.VisualizationItem();
          this.$el.append(item.render().el);
          this.addView(item);
        }
      }
    }

  });

  /**
  *  Visualization list item renderer
  */

  cdb.admin.dashboard.VisualizationItem = cdb.core.View.extend({
    tagName: 'li',

    _TAGS_PER_ITEM: 15,

    _PRIVACY_VALUES: ['public','private'],

    events: {
      'click a.delete': '_deleteVis',
      'click a.status': '_changePrivacy'
    },

    initialize: function() {
      _.bindAll(this, '_destroy', '_changePrivacy');


      if (this.model) {
        this.model.bind('change:privacy', this._setPrivacy, this);
      }

      this.template = cdb.templates.getTemplate('dashboard/views/visualization_list_item');

    },

    _generateTagList: function(tags) {

      if (!tags) return;

      var template = _.template('<a href="/dashboard/visualizations/tag/<%= tag %>" data-tag="<%= tag %>"><%= tag %></a>');

      return _.map(tags, function(t) {
        return template({ tag: t });
      }).reverse().slice(0, this._TAGS_PER_ITEM).join(" ");

    },

    _setPrivacy: function() {
      var $status = this.$('a.status');

      for(var n in this._PRIVACY_VALUES) {
        var privacyName = this._PRIVACY_VALUES[n]
        $status.removeClass(privacyName);
      }

      $status
      .addClass(this.model.get('privacy').toLowerCase())
      .html(this.model.get('privacy'))
      .show();
    },

    _changePrivacy: function(ev) {
      ev.preventDefault();

      this.privacy && this.privacy.clean();
      cdb.god.trigger("closeDialogs");

      // Add privacy selector
      var privacy = this.privacy = new cdb.admin.PrivacySelector({
        model: this.model,
        limitation: !this.options.user.get("actions").private_tables,
        direction: 'up',
        upgrade_url: window.location.protocol + '//' + config.account_host + "/account/" + user_data.username + "/upgrade"
      });

      cdb.god.bind("closeDialogs", this.privacy.hide, this.privacy);

      // Set position and show privacy selector
      this.$el.find(".content").append(this.privacy.render().el);
      this.privacy.show($(ev.target), "position");

      return false;
    },

    _cleanString: function(s, n) {

      if (s) {
        s = s.replace(/<(?:.|\n)*?>/gm, ''); // strip HTML tags
        s = s.substr(0, n-1) + (s.length > n ? '&hellip;' : ''); // truncate string
      }

      return s;

    },

    render: function() {

      if (this.model) {

        var tags = this._generateTagList(this.model.get("tags"));

        // Clean up and truncate the description
        var description = this._cleanString(this.model.get("description"), 55);
        var name        = this._cleanString(this.model.get("name"), 18);

        this.$el.append(this.template(_.extend(this.model.toJSON(), { name: name, description: description, empty: false, tags: tags } )));

        this.$('a.delete').tipsy({ gravity: 's', fade: true });

        // Load stats
        this.stats = new cdb.admin.D3Stats({
          el: this.$el.find(".footer"),
          api_calls: _.toArray(this.model.get("stats")),
          width:214,
          stroke_width: 1.2,
          show_today: true
        });

      } else { // tag placeholder
        this.$el.addClass("empty");
        this.$el.append(this.template( { empty: true, id: null, description: null, tags: null }));
      }

      return this;

    },

    _deleteVis: function(e) {
      this.killEvent(e);

      var dlg = new cdb.admin.DeleteVisualizationDialog();
      this.$el.append(dlg.render().el);

      dlg.ok = this._destroy;
      dlg.open();
    },

    _destroy: function() {
      this.trigger('remove');
    },

    clean: function() {
      // Remove tipsy
      if (this.$("a.delete").data('tipsy')) {
        this.$("a.delete").unbind('mouseenter mouseleave');
        this.$("a.delete").data('tipsy').remove();
      }
      cdb.core.View.prototype.clean.call(this);
    }
  })
