 /**
  *  Visualization list item renderer
  */

  cdb.admin.dashboard.VisualizationItem = cdb.core.View.extend({
    tagName: 'li',

    _TAGS_PER_ITEM: 3,

    events: {
      'click a i.delete':         '_deleteVis',
      'click .vis-tags a':        '_onTagClick',
      'click a i.privacy-status': '_onPrivacyClick'
    },

    initialize: function() {
      _.bindAll(this, '_destroy');
      this.template = cdb.templates.getTemplate('dashboard/views/visualization_list_item');
      this.model.bind('change:privacy', function() {
        this.$(".privacy-status")
          .removeClass(this.model.previous('privacy').toLowerCase())
          .addClass(this.model.get('privacy').toLowerCase());
      }, this)
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
        //
        var original_description = this.model.get("description");
        var rendered_description = original_description ? markdown.toHTML(original_description) : original_description;

        var description       = cdb.Utils.stripHTML(rendered_description);
        var clean_description = this._cleanString(rendered_description, 55);

        var name              = cdb.Utils.stripHTML(this.model.get("name"));
        var clean_name        = this._cleanString(this.model.get("name"), 20);

        var extra_tags_count = attrs.tags.length - tags_per_item;
        this.$el.append(this.template(_.extend(this.model.toJSON(), {
          url: cdb.config.prefixUrl() + '/viz/' + this.model.get('id') + '/map',
          name: name,
          order: this.options.visualization_options.get("order"),
          clean_name: clean_name,
          description: description,
          clean_description: clean_description,
          empty: false,
          tags: tags,
          extra_tags_count: extra_tags_count,
          total_tags: ( attrs.tags && attrs.tags.length ) || 0,
          organization: this.options.user.isInsideOrg(),
          isOwner: this.model.permission.isOwner(this.options.user),
          owner: this.model.permission.owner.renderData(this.options.user),
          current_user_permission: this.model.permission.getPermission(this.options.user) === cdb.admin.Permission.READ_ONLY ? 'READ': null
        })));

        this.$('a i.delete').tipsy({ gravity: 's', fade: true });

        // Load stats
        this.stats = new cdb.admin.D3Stats({
          el: this.$el.find(".vis-graph"),
          stats: this.model.get("stats"),
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

    _onTagClick: function(e) {
      this.killEvent(e);
      var tag = $(e.target).data('tag');
      this.trigger('tagClicked', tag, this);
    },

    _onPrivacyClick: function(e) {
      this.killEvent(e);

      this.privacy_dialog = new cdb.admin.PrivacyDialog({
        model:  this.model,
        config: config,
        user:   this.options.user
      });

      this.privacy_dialog.appendToBody();
      this.privacy_dialog.open();
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
