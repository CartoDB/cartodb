 /**
  *  Visualization list item renderer
  */

  cdb.admin.dashboard.VisualizationItem = cdb.core.View.extend({
    tagName: 'li',

    _TAGS_PER_ITEM: 3,

    events: {
      'click .vis-desc a':        '_onNameClick',
      'click a i.delete':         '_deleteVis',
      'click a i.lock':           '_changeLock',
      'click .vis-tags a':        '_onTagClick',
      'click a i.privacy-status': '_onPrivacyClick',
      'click':                    '_onItemClick'
    },

    initialize: function() {
      _.bindAll(this, '_destroy');
      this.template = cdb.templates.getTemplate('dashboard/views/visualization_list_item');
      if (this.model) this._initBinds();
    },

    _initBinds: function() {
      this.model.bind('change:privacy',     this.render, this);
      this.model.bind('change:permission',  this.render, this);
      this.model.bind('change:locked',      this.render, this);
    },

    _generateTagList: function(tags, selected_tag, tags_count) {

      if (!tags) return;

      tags = tags.slice(0, tags_count);

      var template = _.template('<a href="' + cdb.config.prefixUrl() + '/dashboard/visualizations/tag/<%= tag %>" data-tag="<%= tag %>"><%= tag %></a>');

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

        // Destroy tipsys
        this._destroyTipsys();
        // Clean element
        this.clearSubViews();
        this.$el.empty();

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
        
        // Get total shared users or if the whole organization has access
        var shared_users = 0;
        var users_perm = this.model.permission.getUsersWithAnyPermission();
        var org_perm = this.model.permission.getUsersWithPermission('org');

        if (this.model.permission.getUsersWithPermission('org').length > 0) {
          shared_users = 'ORG';
        } else {
          shared_users = users_perm.length;
        }

        var extra_tags_count = attrs.tags.length - tags_per_item;
        this.$el.append(this.template(_.extend(this.model.toJSON(), {
          url: this._getVisUrl(),
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
          shared_users: shared_users,
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

        // Create tipsys
        this._createTipsys();

      } else { // tag placeholder
        this.$el.addClass("empty");
        this.$el.append(this.template( { empty: true, id: null, description: null, tags: null }));
      }

      return this;

    },

    _getVisUrl: function() {
      var url = '/viz/' + this.model.get('id') + '/map';

      if (cdb.config.prefixUrl()) {
        var owner_username = this.model.permission.owner.get('username');
        url = '/u/' + owner_username + url;
      }

      return url;
    },

    _onTagClick: function(e) {
      this.killEvent(e);
      var tag = $(e.target).data('tag');
      this.trigger('tagClicked', tag, this);
    },

    // Let users open the link in a new tab
    _onNameClick: function(e) {
      e.stopPropagation();
    },

    _onItemClick: function(e) {
      this.killEvent(e);
      window.location = this._getVisUrl();
    },

    _onPrivacyClick: function(e) {
      this.killEvent(e);

      if (this.privacy_dialog) this.privacy_dialog.clean();

      var self = this;
      this.model.getRelatedTables({
        success: function() {
          self.privacy_dialog = new cdb.admin.PrivacyDialog({
            model:  self.model,
            config: config,
            user:   self.options.user
          });

          self.privacy_dialog.appendToBody();
          self.privacy_dialog.open({ center:true });
        }
      }, { force: true });
    },

    _createTipsys: function() {
      if (this.$('a i.delete').length > 0) {
        this.$('a i.delete').tipsy({ gravity: 's', fade: true });  
      }

      if (this.$('a i.lock').length > 0) {
        this.$('a i.lock').tipsy({ gravity: 's', fade: true });  
      }

      if (this.$('i.privacy-status.disabled').length > 0) {
        this.$('i.privacy-status.disabled').tipsy({ gravity: 's', fade: true });  
      }
    },

    _destroyTipsys: function() {
      var self = this;
      var tipsy_elements = [
        'a i.delete',
        'a i.lock',
        'i.privacy-status.disabled'
      ];

      _.each(tipsy_elements, function(el) {
        var $el = self.$(el);
        if ($el.length > 0 && $el.data('tipsy')) {
          $el.unbind('mouseenter mouseleave');
          $el.data('tipsy').$element.remove();
        }
      });
    },

    _deleteVis: function(e) {
      this.killEvent(e);

      var dlg = new cdb.admin.DeleteVisualizationDialog({
        model: this.model
      });

      dlg.ok = this._destroy;
      dlg.appendToBody().open({ center: true });
    },

    _changeLock: function(e) {
      this.killEvent(e);

      var self = this;
      var dlg = new cdb.admin.LockVisualizationDialog({
        model: this.model,
        onResponse: function() {
          self.trigger('lock', self.model, self);
        }
      });

      dlg.appendToBody().open({ center: true });
    },

    _destroy: function() {
      this.trigger('remove', this.model, this);
    },

    clean: function() {
      // Remove tipsy
      this._destroyTipsys();
      cdb.core.View.prototype.clean.call(this);
    }

  })
