
/**
 * common header for map/table views
 */


var OptionsMenu = cdb.admin.DropdownMenu.extend({
  events: {
    'click .export':        '_export',
    'click .duplicate':     '_duplicate',
    'click .append':        '_append',
    'click .delete_table':  '_delete',
    'click .merge_tables':  '_mergeTables'
  },

  show: function() {
    this.render();
    this.constructor.__super__.show.apply(this);
  },

  _export: function(e){
    e.preventDefault();

    // Should check if query is applied and it is correct, if not, user can't
    // export anything...
    if (this.options.table.isInSQLView() && !this.options.dataLayer.get("query")) {
      return;
    }

    var export_dialog = new cdb.admin.ExportTableDialog({
      model: this.options.table,
      config: config,
      user_data: user_data
    });

    $("body").append(export_dialog.render().el);
    export_dialog.open();
  },

  _duplicate: function(e){
    e.preventDefault();

    // Should check if query is applied and it is correct, if not, user can't
    // duplicate a table or a query...
    if (this.options.table.isInSQLView() && !this.options.dataLayer.get("query")) {
      return;
    }

    var duplicate_dialog = new cdb.admin.DuplicateTable({
      model: this.options.table
    });

    $("body").append(duplicate_dialog.render().el);
    duplicate_dialog.open();
  },

  _append: function(e){
    e.preventDefault();
  },

  _delete: function(e){
    e.preventDefault();

    this.delete_dialog = new cdb.admin.DeleteDialog({
      model: this.options.table,
      config: config,
      user_data: user_data,
    });
    $("body").append(this.delete_dialog.render().el);
    this.delete_dialog.open();

    this.delete_dialog.wait()
      .done(this.deleteTable.bind(this));
  },

  _mergeTables: function(e) { // TODO: set prior state
    e.preventDefault();

    var mergeDialog = new cdb.admin.MergeTablesDialog({
      table: this.options.table
    });

    mergeDialog.appendToBody().open({ center:true });

    //window.mergeTableDialog = mergeDialog;

  },


  deleteTable: function() {
    var self = this;
    this.options.table.destroy({wait: true})
      .done(function(){
        window.location = "/dashboard";
      }
    );
  },

});



cdb.admin.Header = cdb.core.View.extend({
  _TEXTS: {
    _DEFAULT_DESCRIPTION:         'add a description for this table...',
    _DEFAULT_QUERY_DESCRIPTION:   'There is no description...',
    _DEFAULT_ADD_TAG_BUTTON:      'add tags',
    _DEFAULT_EDIT_TAG_BUTTON:     'edit tags'
  },
  _PRIVACY_VALUES: [
    'public',
    'private'
  ],
  _MAX_DESCRIPTION_LENGTH: 200,
  events: {
    'click .clearview':           'clearView',
    'click .status':              '_addPrivacySelector',
    'click .change_title':        '_changeTitle',
    'click .table_description p': '_changeDescription',
    'click .georeference':        'georeference',
    'click span.tags > *':        '_changeTags'
  },

  initialize: function(options) {
    var self = this;


    this.$body = this.options.body || $('body');
    this.table = this.model;
    this.globalError = this.options.globalError;
    this.createBindings();

    this.add_related_model(this.table);
    this.$('.clearview').hide();

    // Print all the information and don't
    // wait for table changes, it renders faster
    this.setTableInfo();
    this.createUserMenu();
    this.createOptionsMenu();

    // if(this.table.isInSQLView()) {
    //   this.onSQLView();
    // }
  },

  createBindings: function() {
    _.bindAll(this, '_changeTitle', '_setDescription', '_setTags', '_setNameAndStatus');
    this.table.bind('change:dataSource', this.onSQLView, this);
    this.table.bind('privacyUpdated', this._setNameAndStatus);
    this.bind('descriptionChanged', this._setDescription);
    this.bind('tagsChanged', this._setTags);
    this.table.bind('change:name', this._setNameAndStatus);
  },

  createUserMenu: function() {
    // User menu
    var user_menu = this.user_menu = new cdb.admin.DropdownMenu({
      target: $('a.account'),
      username: this.options.user.get('username'),
      host: this.options.config.account_host,
      template_base: 'common/views/settings_item'
    }).bind("onDropdownShown",function(ev) {
      cdb.god.unbind("closeDialogs", user_menu.hide, user_menu);
      cdb.god.trigger("closeDialogs");
      cdb.god.bind("closeDialogs", user_menu.hide, user_menu);
    });

    cdb.god.bind("closeDialogs", user_menu.hide, user_menu);
    this.$body.append(user_menu.render().el);
    this.addView(user_menu);
  },

  createOptionsMenu: function() {
    // Options menu
    var options_menu = this.options_menu = new OptionsMenu({
      target: $('a.options'),
      model: { username: this.options.user.get('username') },
      username: this.options.user.get('username'),
      table: this.table,
      template_base: 'table/views/header_table_options'
    }).bind("onDropdownShown",function(ev) {
      cdb.god.unbind("closeDialogs", options_menu.hide, options_menu);
      cdb.god.trigger("closeDialogs");
      cdb.god.bind("closeDialogs", options_menu.hide, options_menu);
    });
    cdb.god.bind("closeDialogs", options_menu.hide, options_menu);
    this.addView(options_menu);
  },

  setOptionsMenu: function(dl) {
    this.options_menu.options.dataLayer = dl;
    $('body').append(this.options_menu.render().el);
  },

  setDataLayer: function(dl) {
    this.dataLayer = dl;
    // Set the new datalayer to the options menu
    // due to the fact that we need for duplicating
    // dialog, export dialog, and so on...
    this.setOptionsMenu(dl);
  },

  georeference: function(e) {
    e.preventDefault();
    var dlg = new cdb.admin.GeoreferenceDialog({
      model: this.table,
      geocoder: this.options.geocoder
    });
    dlg.appendToBody().open();
  },

  setTableInfo: function() {
    this._setNameAndStatus();
    this._setDescription();
    this._setTags();
  },

  /**
   *  Set Name and status of the table
   */
  _setNameAndStatus: function() {

    this.$('h2.special a').html(this.table.get('name'));

    var $status = this.$('.status');

    for(var n in this._PRIVACY_VALUES) {
      var privacyName = this._PRIVACY_VALUES[n]
      $status.removeClass(privacyName);
    }

    $status
      .addClass(this.table.get('privacy').toLowerCase())
      .html(this.table.get('privacy'));
  },

  /**
   *  Set table description in the header
   */
  _setDescription: function() {
    var default_description = this._TEXTS._DEFAULT_DESCRIPTION;

    if(this.table.sqlView) {
      default_description = "<i>" + this._TEXTS._DEFAULT_QUERY_DESCRIPTION + "</i>";
    }

    this.$('.table_description p').html(this.table.get('description') || default_description);
  },

  /**
   *  Set table tags in the header
   */
  _setTags: function() {
    var tag_button_text = this._TEXTS._DEFAULT_ADD_TAG_BUTTON;
    if (this.table.get('tags')) {
      tag_button_text = this._TEXTS._DEFAULT_EDIT_TAG_BUTTON;
    }
    if (this.table.sqlView) {
      tag_button_text = '';
    }
    if (this.table.get('tags')) {
      var tags = this.table.get('tags').split(",");

      var i = _.size(tags);
      var word = (i == 1) ? "tag" : "tags";
      var count = "<a href='#edit_tags'>" + i + " " + word + "</a>";

      this.$('span.tags').removeClass("empty");
      this.$('span.tags').html(count);

    } else {
      this.$('span.tags').addClass("empty");
      this.$('span.tags').html("<a href='#add_tags'>"+tag_button_text+"</a>");
    }
  },

  onSQLView: function() {
    this.setTableInfo();
    if(this.table.isInSQLView()) {
      this.$('.clearview').show();
      this.$el.addClass('query');
      this.$('.status').hide();
      this.$('.georeference').parent().hide();
    } else {
      this.$('.clearview').hide();
      this.$el.removeClass('query');
      this.$('.status').show();
      this.$('.georeference').parent().show();
      this.trigger('clearSQLView');
    }

  },

  clearView: function(e) {
    e.preventDefault();
    if(this.dataLayer) {
      this.trigger('clearSQLView');
      /*
      this.dataLayer.save({ query: undefined });
      this.dataLayer.addToHistory("query", "SELECT * FROM " + this.table.get('name'));
      */
      $.faviconNotify('/favicons/cartofante_blue.png');
    }
    return false;
  },

  _addPrivacySelector: function(ev) {
    ev.preventDefault();

    this.privacy && this.privacy.clean();
    cdb.god.trigger("closeDialogs");
        // Add privacy selector
    var privacy = this.privacy = new cdb.admin.PrivacySelector({
      model: this.table,
      limitation: !this.options.user.get("private_tables"),
      direction: 'down',
      upgrade_url: 'https://' + config.account_host + "/account/" + user_data.username + "/upgrade"
    });

    cdb.god.bind("closeDialogs", this.privacy.hide, this.privacy);

    this.$el.parent().append(this.privacy.render().el);

    this.privacy.show($(ev.target),"offset");

    return false;
  },

  _changeDescription: function(e) {
    var self = this;
    this.killEvent(e);
    if(!this.table.sqlView) {
      this.description_dialog && this.description_dialog.clean();
      cdb.god.trigger("closeDialogs");

      var description_dialog = this.description_dialog = new cdb.admin.EditTextDialog({
        initial_value: this.table.get('description') || '',
        template_name: 'table/views/edit_name',
        clean_on_hide: true,
        maxLength: self._MAX_DESCRIPTION_LENGTH,
        modal_class: 'edit_name_dialog',
        res: function(val) {
          // safety check
          val = val.substr(0, self._MAX_DESCRIPTION_LENGTH);
          if (val !== self.model.get('description')) {
            // Show a loader, and when saves the new description
            // Take into account we don't trigger save event to
            // avoid change the whole application
            self.globalError.showError('Saving ... ', 'load');
            $.when(self.model.save({ description:val }, { silent:true })).done(function() {
              self.trigger('descriptionChanged');
              self.globalError.showError('Saved', 'info', 3000);
            }).fail(function() {
              self.globalError.showError('Something has failed', 'error', 5000);
            });
          }
        }
      });

      cdb.god.bind("closeDialogs", description_dialog.hide, description_dialog);

      var pos = $(e.target).offset();
      pos.left -= $(window).scrollLeft();
      pos.top -= $(window).scrollTop();
      var w = Math.max($(e.target).width() + 100, 280);

      description_dialog.showAt(pos.left - 20, pos.top - 13, w);
    }
  },

  _changeTitle: function(e) {
    var self = this;
    this.killEvent(e);
    if(!this.table.sqlView) {
      this.title_dialog && this.title_dialog.clean();
      cdb.god.trigger("closeDialogs");
      var previousName = this.table.get('name');
      var title_dialog = this.title_dialog = new cdb.admin.EditTextDialog({
        initial_value: previousName,
        template_name: 'table/views/edit_name',
        clean_on_hide: true,
        modal_class: 'edit_name_dialog',
        res: function(val) {
          if(val !== self.model.get('name') && val != '') {
            var confirmation = new cdb.admin.RenameConfirmationDialog({
              model: self.table,
              globalError: self.globalError,
              newName: val
            });

            confirmation.appendToBody().open();
            var promise = confirmation.confirm();
            $.when(promise).done(self._renameTable.bind(self));
          }
        }
      });


      cdb.god.bind("closeDialogs", title_dialog.hide, title_dialog);

      // when the table has horizontal scroll for some reason
      // object offset returned has the scroll added
      var pos = $(e.target).offset();
      pos.left -= $(window).scrollLeft()
      pos.top -= $(window).scrollTop()
      var w = Math.max($(e.target).width() + 100, 280);
      title_dialog.showAt(pos.left - 20, pos.top - 6, w);
    }
  },

  _renameTable: function(newName) {
    var self = this;
    self.globalError.showError('Renaming your table ... ', 'load', -1);
    $.when(self.model.save({ name: newName }, {wait: true})).done(function() {
      self.globalError.showError('Saved', 'info', 3000);
    });
  },

  _changeTags: function(e) {
    var self = this;
    e.preventDefault();
    e.stopPropagation();
    if(!this.table.sqlView) {
      this.tags_dialog && this.tags_dialog.clean();
      cdb.god.trigger("closeDialogs");

      var tags_dialog = this.tags_dialog = new cdb.admin.TagsDialog({
        initial_value: this.table.get('tags'),
        template_name: 'table/views/edit_name',
        clean_on_hide: false,
        modal_class: 'edit_name_dialog',
        res: function(val) {
          if (val !== self.model.get('tags')) {
            // Show a loader, and when saves new tags
            // Take into account we don't trigger save event to
            // avoid change the whole application (same as description)
            self.model.notice('Saving ... ', 'load');
            $.when(self.model.save({ tags:val }, { silent:true })).done(function() {
              self.trigger('tagsChanged');
              self.model.notice('Saved', 'info', 3000);
            }).fail(function() {
              self.model.notice('Something has failed', 'error', 5000);
            });
          }
        }
      });

      cdb.god.bind("closeDialogs", tags_dialog.hide, tags_dialog);

      // when the table has horizontal scroll for some reason
      // object offset returned has the scroll added
      var $tags = $(e.target).closest("span.tags")
      var pos = $tags.offset();
      pos.left -= $(window).scrollLeft();
      pos.top -= $(window).scrollTop() + 6;

      var w = Math.max($tags.find("p").width() + 100, 280);
      tags_dialog.showAt(pos.left - 10, pos.top - 5);
    }
  }
});
