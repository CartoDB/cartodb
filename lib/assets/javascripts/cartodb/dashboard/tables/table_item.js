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

  _PRIVACY_VALUES: ['public','private', 'link'],

  _TEXTS: {
    sync: {
      state: {
        enabled: 'SYNCED <%= ran_at %>',
        error: 'ERROR WITH SYNC'
      },
      few_moments: _t('in a few moments'),
      msg: {
        enabled: 'This source will be synced again <%= run_at %>.',
        error: 'The source is not available anymore. Please check its location.'
      }
    }
  },

  events: {
    'click a i.delete':         '_deleteTable',
    'click a i.privacy-status': '_changePrivacy',
    'click .table-tags a':      '_onTagClick',
    'click .feed.failure a':    '_onSyncFailureClick'
  },

  initialize: function() {
    _.bindAll(this, "_changePrivacy", "_showDeleteDialog");
    this.template = cdb.templates.getTemplate('dashboard/views/table_list_item');
    this.model.bind('change:privacy', this._setPrivacy, this);
  },

  _generateTagList: function(tags, selected_tag) {

    if (!tags) return;

    var tags_count = this._TAGS_PER_ITEM;

    tags = tags.slice(0, tags_count);

    var template = _.template('<a href="/dashboard/tables/tag/<%= tag %>" data-tag="<%= tag %>"><%= tag %></a>');

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

  _onSyncFailureClick: function(e) {
    this.killEvent(e);
  },

  _onTagClick: function(e) {
    this.killEvent(e);
    var tag = $(e.target).data('tag');
    this.trigger('tagClicked', tag, this)
  },

  render: function() {
    var attrs = this.model.toJSON();

    attrs.table_size = this._bytesToSize(attrs.table.size);

    var selected_tag = this.options.table_options.get("tags")

    var tags              = this._generateTagList(attrs.tags, selected_tag);

    var name              = cdb.Utils.stripHTML(this.model.get("name"));

    var original_description = this.model.get("description");
    var rendered_description = original_description ? markdown.toHTML(original_description) : original_description;

    var description          = cdb.Utils.stripHTML(rendered_description);

    var pretty_row_count = cdb.Utils.formatNumber(this.model.attributes.table.row_count);

    var extra_tags_count = attrs.tags.length - this._TAGS_PER_ITEM;

    var template_vars = {
      sync_status: "",
      order: this.options.table_options.get("order"),
      row_count: pretty_row_count,
      name: name,
      description: description,
      tags: tags,
      organization: this.options.user.isInsideOrg(),
      extra_tags_count: extra_tags_count,
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

    var $tableInfo = this.$el.find(".table_info");
    var $title = this.$el.find("h3 a");
    var $time  = this.$el.find("p.time");

    this.$(".table-sync span.feed").tipsy({
      fade: true,
      gravity: "s",
      className: 'feed',
      offset: 0,
      title: function() {
        return $(this).attr("data-tipsy")
      }
    });

    this.$('a i.delete').tipsy({ gravity: 's', fade: true });

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

    this.table = new cdb.admin.CartoDBTableMetadata({ id: this.model.get("table").id });
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
    this.trigger('remove');
  },

  clean: function() {
    // Remove tipsy
    if (this.$("a.delete").data('tipsy')) {
      this.$("a.delete").unbind('mouseenter mouseleave');
      this.$("a.delete").data('tipsy').remove();
    }

    cdb.core.View.prototype.clean.call(this);
  },

  /**
   *  Set privacy status
   */
  _setPrivacy: function() {
    var $status = this.$('a.status');

    for(var n in this._PRIVACY_VALUES) {
      var privacyName = this._PRIVACY_VALUES[n]
      $status.removeClass(privacyName);
    }

    var privacy = this.model.get('privacy');

    if (privacy == 'LINK') privacy = "WITH LINK";

    $status
      .addClass(this.model.get('privacy').toLowerCase())
      .html(privacy)
      .show();
  },

  /**
   *  Update the privacy status
   */
  _changePrivacy: function(e) {
    this.killEvent(e);

    this.privacy_dialog = new cdb.admin.PrivacyDialog({
      model:  this.model,
      config: config,
      user:   this.options.user
    });

    this.privacy_dialog.appendToBody();
    this.privacy_dialog.open();
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
