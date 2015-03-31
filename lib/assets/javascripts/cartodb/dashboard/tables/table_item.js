/**
* Single table item in dashboard tables list
*
* Usage example:
*
*  var li = new cdb.admin.dashboard.TableItem({
*    model: table_model,
*    limitation: !this.options.user.get("private_tables")
*  });
*
*/

cdb.admin.dashboard.TableItem = cdb.core.View.extend({

  tagName: 'li',

  className: 'table-item',

  _TAGS_PER_ITEM: 6,

  _TEXTS: {
    sync: {
      state: {
        enabled: 'SYNCED <%- ran_at %>',
        error: 'ERROR WITH SYNC'
      },
      few_moments: _t('in a few moments'),
      msg: {
        enabled: 'This source will be synced again <%- run_at %>.',
        error: 'The source is not available anymore. Please check its location.'
      }
    }
  },

  events: {
    'click .table-title a':     '_onNameClick',
    'click a i.delete':         '_deleteTable',
    'click a i.privacy-status': '_changePrivacy',
    'click a i.lock':           '_changeLock',
    'click a i.unlock':         '_changeLock',
    'click .table-tags a':      '_onTagClick',
    'click .feed.failure a':    '_onSyncFailureClick',
    'click .js-like':           '_onLikeClick',
    'click':                    '_onItemClick'
  },

  initialize: function() {

    _.bindAll(this, "_changePrivacy", "_showDeleteDialog", "_onLikeClick");

    this.template = cdb.templates.getTemplate('dashboard/views/table_list_item');
    this.model.bind('change:privacy', this._setPrivacy, this);

    // When model is loaded, check if permissions have changed
    this.model.bind('change:permission', this._setSharedUsers, this);

    this.add_related_model(this.model.like);
    this.model.like.bind("change:likes", this._onLikeChange, this);

  },

  _generateTagList: function(tags, selected_tag) {

    if (!tags) return;

    var tags_count = this._TAGS_PER_ITEM;

    tags = tags.slice(0, tags_count);

    var template = _.template('<a href="' + cdb.config.prefixUrl() + '/dashboard/tables/tag/<%- tag %>" data-tag="<%- tag %>"><%- tag %></a>');

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

    return result.reverse().join(" ");

  },

  _cleanString: function(s, n) {

    if (s) {
      s = cdb.Utils.stripHTML(s);
      s = cdb.Utils.truncate(s, n);
    }

    return s;

  },

  _onLikeChange: function() {

    this.$el.find(".js-counter").text(this.model.like.get("likes"));

    var $button  = this.$el.find(".js-like");
    var $icon    = this.$el.find(".js-icon");
    var $counter = this.$el.find(".js-counter");

    if (this.model.like.get("liked")) {

      $button.addClass("is-highlighted");
      $icon.addClass("is-pulsating is-animated");
      $icon.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
        $(this).removeClass("is-pulsating is-animated");
      });

    } else {

      $icon.addClass("is-pulsating is-animated");
      $icon.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
        $(this).removeClass("is-pulsating is-animated");
        $button.removeClass("is-highlighted");
      });

    }

  },

  _onSyncFailureClick: function(e) {
    this.killEvent(e);
  },

  _onTagClick: function(e) {
    this.killEvent(e);
    var tag = $(e.target).data('tag');
    this.trigger('tagClicked', tag, this);
  },

  _onLikeClick: function(e) {
    this.killEvent(e);
    this.model.like.toggleLiked();
  },

  _onItemClick: function(e) {
    if (e) e.stopPropagation();

    // Don't go to table view if it is not a geom kind
    if (this.model.get('kind') !== "geom") {
      return false;
    }

    // If user is using middle or right click, stop
    // action avoiding linux problems opening link
    // in a new tab
    if (e.which !== 2 && e.which !== 3) {
      window.location = this._getTableUrl();
    }
  },

  // Let users open the link in a new tab
  _onNameClick: function(e) {
    e.stopPropagation();

    // Don't go to table view if it is not a geom kind
    if (this.model.get('kind') !== "geom") {
      e.preventDefault();
      return false;
    }
  },

  _getTableUrl: function() {
    // If the table kind is different than geom
    // no url specified
    if (this.model.get('kind') !== "geom") {
      return ''
    }

    return cdb.config.prefixUrl() + '/tables/' + encodeURIComponent(this.model.tableMetadata().getUnquotedName());
  },

  render: function() {
    // Destroy tipsys if we find any...
    this.clearSubViews();

    var attrs = this.model.toJSON();
    attrs.table_size = ( attrs.table && attrs.table.size !== undefined && this._bytesToSize(attrs.table.size) ) || '';

    var selected_tag = this.options.table_options.get("tags")
    var tags = this._generateTagList(attrs.tags, selected_tag);
    var name= cdb.Utils.stripHTML(this.model.get("name"));
    var original_description = this.model.get("description");
    var rendered_description = original_description ? markdown.toHTML(original_description) : original_description;
    var description          = cdb.Utils.stripHTML(rendered_description);
    var pretty_row_count = attrs.table && attrs.table.row_count !== undefined && cdb.Utils.formatNumber(attrs.table.row_count) || '';

    var extra_tags_count = attrs.tags.length - this._TAGS_PER_ITEM;

    // Get total shared users or if the whole organization has access
    var shared_users = 0;
    var users_perm = this.model.permission.getUsersWithAnyPermission();
    var org_perm = this.model.permission.getUsersWithPermission('org');

    if (this.model.permission.getUsersWithPermission('org').length > 0) {
      shared_users = 'ORG';
    } else {
      shared_users = users_perm.length;
    }

    var template_vars = {
      url: this._getTableUrl(),
      sync_status: "",
      order: this.options.table_options.get("order"),
      row_count: pretty_row_count,
      name: name,
      description: description,
      tags: tags,
      kind: this.model.get('kind'),
      organization: this.options.user.isInsideOrg(),
      extra_tags_count: extra_tags_count,
      isOwner: this.model.permission.isOwner(this.options.user),
      shared_users: shared_users,
      owner: this.model.permission.owner.renderData(this.options.user),
      current_user_permission: this.model.permission.getPermission(this.options.user) === cdb.admin.Permission.READ_ONLY ? 'READ': null
    };

    // Check sync status
    // If table is under synchronization, it will show the info
    // available about the sync.
    if (!_.isEmpty(this.model.get("synchronization"))) {

      var sync_attrs = _.clone(this.model.get("synchronization"));
      sync_attrs.ran_at = moment(sync_attrs.ran_at || new Date()).fromNow();

      // Due to the time we need to polling, we have to display to the user
      // that the sync will be in a few moment
      if (!sync_attrs.run_at || (new Date(sync_attrs.run_at) <= new Date())) {
        sync_attrs.run_at = this._TEXTS.sync.few_moments;
      } else {
        sync_attrs.run_at = moment(sync_attrs.run_at).fromNow();
      }

      var state = sync_attrs.state;

      _.extend(
        template_vars,
        {
          sync_status: state,
          sync_message: _.template(this._TEXTS.sync.state[state == "failure" ? "error" : "enabled" ])(sync_attrs),
          sync_tooltip: _.template(this._TEXTS.sync.msg[state == "failure" ? "error" : "enabled" ])(sync_attrs)
        }
      );
    }

    this.$el.append(this.template(_.extend(attrs, template_vars)));

    // Create necessary tipsys
    this._createTipsys();

    return this;
  },

  _deleteTable: function(e) {
    this.killEvent(e);
    this._confirmAndDelete(e);
  },

  /**
  * Show delete confirmation after decides delete a table
  */
  _confirmAndDelete: function(ev) {
    ev && ev.preventDefault();

    this.table = new cdb.admin.CartoDBTableMetadata({ id: this.model.get("table").id, no_data_fetch: true });
    this._showDeleteDialog();
  },

  _showDeleteDialog: function() {

    var self = this;

    this.delete_dialog = new cdb.admin.DeleteDialog({
      model: this.table,
      title: "Delete this table",
      content: 'You are about to delete this table. Doing so will result in the deletion of this dataset. We recommend you export it before deleting it.',
      config: this.options.config,
      user: this.options.user
    });

    $("body").append(this.delete_dialog.render().el);
    this.delete_dialog.open();

    this.delete_dialog.wait()
    .done(this.deleteTable.bind(this))
    .fail(this.cleanDeleteDialog.bind(this));

  },

  cleanDeleteDialog: function() {
    this.delete_dialog.clean();
  },

  deleteTable: function() {
    this.trigger('remove', this.model, this);
  },


  /**
   *  Set privacy status
   */
  _setPrivacy: function() {
    var $status = this.$('a i.privacy-status');

    $status
      .removeClass(this.model.previous('privacy').toLowerCase())
      .addClass(this.model.get('privacy').toLowerCase());
  },

  /**
   *  Set shared users text
   */
  _setSharedUsers: function() {
    // Remove previous
    this.$('a i.privacy-status').html('');

    // Create new
    var $shared_users = $('<span>').addClass('shared_users');

    if (this.model.permission.acl.size() > 0) {
      // Get total shared users or if the whole organization has access
      var shared_users = 0;
      var users_perm = this.model.permission.getUsersWithAnyPermission();
      var org_perm = this.model.permission.getUsersWithPermission('org');

      if (this.model.permission.getUsersWithPermission('org').length > 0) {
        shared_users = 'ORG';
      } else {
        shared_users = users_perm.length;
      }

      $shared_users.text( (shared_users !== 0) ? shared_users : '' );

      this.$('a i.privacy-status').append($shared_users);
    }

  },

  /**
   *  Update the privacy status
   */
  _changePrivacy: function(e) {
    this.killEvent(e);

    this.privacy_dialog = new cdb.admin.PrivacyDialog({
      model:  this.model,
      config: config,
      user:   this.options.user,
      source: "dashboard"
    });

    this.privacy_dialog.appendToBody();
    this.privacy_dialog.open({ center: true });
  },


  _changeLock: function(e) {
    this.killEvent(e);

    var self = this;
    var dlg = new cdb.admin.LockVisualizationDialog({
      model: this.model,
      user: this.options.user,
      onResponse: function() {
        self.trigger('lock', self.model, self);
      }
    });

    dlg.appendToBody().open({ center: true });
  },

  _createTipsys: function() {
    if (this.$(".table-sync span.feed").length > 0) {
      this.addView(
        new cdb.common.TipsyTooltip({
          el: this.$(".table-sync span.feed"),
          gravity: "s",
          className: 'feed',
          offset: 0
        })
      );
    }
    
    if (this.$('a i.delete').length > 0) {
      this.addView(
        new cdb.common.TipsyTooltip({
          el: this.$("a i.delete")
        })
      );
    }

    if (this.$('a i.lock').length > 0) {
      this.addView(
        new cdb.common.TipsyTooltip({
          el: this.$("a i.lock")
        })
      );
    }

    if (this.$('a i.unlock').length > 0) {
      this.addView(
        new cdb.common.TipsyTooltip({
          el: this.$("a i.unlock")
        })
      );
    }

    if (this.$('i.privacy-status.disabled').length > 0) {
      this.addView(
        new cdb.common.TipsyTooltip({
          el: this.$("i.privacy-status.disabled")
        })
      );
    }
    
  },

  // Help functions
  _bytesToSize: function(by) {
    var bytes = parseInt(by.toString())
    , sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes == 0) return '0 KB';
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    var value = (bytes / Math.pow(1024, i)).toFixed(2);

    if (value % 1 == 0) {
      value = parseInt(value)
    }
    return value + " " + sizes[i];
  }

});
