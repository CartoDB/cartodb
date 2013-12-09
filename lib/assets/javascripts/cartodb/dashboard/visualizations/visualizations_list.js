
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
            user: self.options.user,
            visualization_options: self.collection.options
          })
          .bind('remove', function() {

            self.trigger('showLoader');

            var xhr = this.model.destroy();

            $.when(xhr).done(function() {
              self.trigger('remove');
            });

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

    _TAGS_PER_ITEM: 3,

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

    _generateTagList: function(tags, selected_tag, tags_count) {

      if (!tags) return;

      tags = tags.slice(0, tags_count);

      var template = _.template('<a href="/dashboard/visualizations/tag/<%= tag %>" data-tag="<%= tag %>"><%= tag %></a>');

      if (selected_tag) {
        var selected_tag_included = _.contains(tags, selected_tag);
        if (!selected_tag_included) tags_count--;
      }

      // Render the tags
      var result = _.map(tags, function(t) {
        return template({ tag: t });
      }).slice(0, tags_count);

      // Add the selected_tag in case it wasn't already added
      if (!selected_tag_included && selected_tag) {
        result.push(template({ tag: selected_tag }));
      }

      return result.join(" ");

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
        s = cdb.Utils.stripHTML(s);
        s = cdb.Utils.truncate(s, n);
      }

      return s;

    },

    render: function() {

      if (this.model) {

        var attrs = this.model.toJSON();

        var selected_tag = this.options.visualization_options.get("tags")

        var tag_list = this.model.get("tags");
        var tags_per_item = this._TAGS_PER_ITEM;

        var slice_tag_list = tag_list.slice(0, tags_per_item);

        if (slice_tag_list.join("").length > 30) {
          tags_per_item = 1;
        } else if (slice_tag_list.join("").length > 15) {
          tags_per_item = 2;
        }

        tags = this._generateTagList(tag_list, selected_tag, tags_per_item);

        // Clean up and truncate name and description
        var description       = cdb.Utils.stripHTML(this.model.get("description"));
        var clean_description = this._cleanString(this.model.get("description"), 55);

        var name              = cdb.Utils.stripHTML(this.model.get("name"));
        var clean_name        = this._cleanString(this.model.get("name"), 20);

        var extra_tags_count = attrs.tags.length - tags_per_item;
        this.$el.append(this.template(_.extend(this.model.toJSON(), {
          name: name,
          clean_name: clean_name,
          description: description,
          clean_description: clean_description,
          empty: false,
          tags: tags,
          extra_tags_count: extra_tags_count
        })));

        this.$('a.delete').tipsy({ gravity: 's', fade: true });

        // Load stats
        this.stats = new cdb.admin.D3Stats({
          el: this.$el.find(".footer"),
          api_calls: _.toArray(this.model.get("stats")),
          width: 121,
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
      dlg.ok = this._destroy;
      dlg.appendToBody().open();
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
