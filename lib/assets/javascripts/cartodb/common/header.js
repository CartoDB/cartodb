
/**
 *  Common header for visualizations view
 *  - It needs a visualization model, config and user data.
 *    
 *    var header = new cdb.admin.Header({
 *      el:           this.$('header'),
 *      model:        this.vis,
 *      user:         this.user,
 *      config:       this.options.config
 *    });
 *
 *  TODO: SPECS AS A BITCH!
 *
 */

cdb.admin.Header = cdb.core.View.extend({
  
  _TEXTS: {
    _DEFAULT_DESCRIPTION:         'add a description for this table...',
    _DEFAULT_QUERY_DESCRIPTION:   'There is no description...',
    _DEFAULT_ADD_TAG_BUTTON:      'add tags',
    _DEFAULT_EDIT_TAG_BUTTON:     'edit tags'
  },

  _PRIVACY_VALUES: ['public','private'],

  _MAX_DESCRIPTION_LENGTH: 200,

  events: {
    'click .status':              '_addPrivacySelector',
    'click .change_title':        '_changeTitle',
    'click .table_description p': '_changeDescription',
    'click span.tags > *':        '_changeTags',
    'click a.account':            '_createUserMenu',
    'click a.options':            '_createOptionsMenu',
    'click a.share':              '_shareVisualization'
  },

  initialize: function(options) {
    _.bindAll(this, '_changeTitle', '_setDescription', '_setTags');
    var self = this;

    this.$body = $('body');
    this.globalError = this.options.globalError;
    this.createBindings();

    this.$('.clearview').hide();

    // Print all the information and don't
    // wait for table changes, it renders faster
    this.setTableInfo();
  },

  createBindings: function() {
    //this.bind('change:dataSource',  this.onSQLView,       this);
    this.model.bind('change:name',          this._setName,        this);
    this.model.bind('change:description',   this._setDescription, this);
    this.model.bind('change:tags',          this._setTags,        this);
    this.model.bind('change:privacy',       this._setPrivacy,     this);
    this.model.bind('change:visualization', this.setTableInfo,  this);
  },

  _createUserMenu: function(e) {
    e.preventDefault()
    e.stopPropagation();

    // User menu
    var user_menu = new cdb.admin.DropdownMenu({
      target: $(e.target),
      username: this.options.user.get('username'),
      host: this.options.config.account_host,
      template_base: 'common/views/settings_item'
    }).bind("onDropdownShown",function(ev) {
      cdb.god.unbind("closeDialogs", user_menu.hide, user_menu);
      cdb.god.trigger("closeDialogs");
      cdb.god.bind("closeDialogs", user_menu.hide, user_menu);
    });
    this.$body.append(user_menu.render().el);
    user_menu.open(e);

    user_menu.bind('onDropdownHidden', function() {
      cdb.god.unbind(null, null, user_menu);
    });
  },

  _createOptionsMenu: function(e) {
    e.preventDefault()
    e.stopPropagation();

    // // Options menu
    // var options_menu = t = new cdb.admin.HeaderOptionsMenu({
    //   target: $(e.target),
    //   model: { username: this.options.user.get('username') },
    //   username: this.options.user.get('username'),
    //   geocoder: this.options.geocoder,
    //   table: this.table,
    //   template_base: 'table/views/header_table_options'
    // }).bind("onDropdownShown",function(ev) {
    //   cdb.god.unbind("closeDialogs", options_menu.hide, options_menu);
    //   cdb.god.trigger("closeDialogs");
    //   cdb.god.bind("closeDialogs", options_menu.hide, options_menu);
    // });
    // this.$body.append(options_menu.render().el);
    // options_menu.open(e);
    // options_menu.bind('onDropdownHidden', function() {
    //   cdb.god.unbind(null, null, options_menu);
    // });
  },

  _shareVisualization: function(e) {
    e.preventDefault();
    e.stopPropagation();

    var privacy = this.model.get('privacy').toLowerCase()
      , dialog
      , center = true;

    // If the table is not public, we'll show a warning dialog
    if (privacy != 'public') {
      dialog = new cdb.admin.NoShareMapDialog({
        map: this.model.map,
        table: this.options.table,
        user: this.options.user_data
      });
    } else {
      dialog = new cdb.admin.ShareMapDialog({
        map: this.model.map,
        table: this.options.table,
        user: this.options.user_data
      });
      center = true;
    }

    dlg.appendToBody().open({ center: center });

    return false;

  },

  setTableInfo: function() {
    this._setName();
    this._setPrivacy();
    this._setDescription();
    this._setTags();
    this._setVisualization();
  },

  /**
   *  Set Name of the table
   */
  _setName: function() {
    this.$('h1 a').html(this.model.get('name'));
  },

  /**
   *  Set privacy status of the table
   */
  _setPrivacy: function() {
    var $status = this.$('.status');

    for(var n in this._PRIVACY_VALUES) {
      var privacyName = this._PRIVACY_VALUES[n]
      $status.removeClass(privacyName);
    }

    $status
      .addClass(this.model.get('privacy').toLowerCase())
      .html(this.model.get('privacy'));
  },

  /**
   *  Set table description in the header
   */
  _setDescription: function() {
    var default_description = this._TEXTS._DEFAULT_DESCRIPTION;

    // if (this.table.sqlView) {
    //   default_description = "<i>" + this._TEXTS._DEFAULT_QUERY_DESCRIPTION + "</i>";
    // }

    this.$('.table_description p').html(this.model.get('description') || default_description);
  },

  /**
   *  Set table tags in the header
   */
  _setTags: function() {
    var tag_button_text = this._TEXTS._DEFAULT_ADD_TAG_BUTTON
      , tags = this.model.get('tags');


    if (tags) {
      tag_button_text = this._TEXTS._DEFAULT_EDIT_TAG_BUTTON;
    }
    // if (this.model.sqlView) {
    //   tag_button_text = '';
    // }

    if (tags) {
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

  /**
   *  Set visualization type and change share button
   */
  _setVisualization: function() {
    // Change visualization type
    var $vis_type = this.$('.vis_type')
      , $share = this.$('a.share')
      , is_visualization = this.model.get('visualization');

    if (is_visualization) {
      $vis_type
        .text('V')
        .removeClass('multi single')
        .addClass('multi');
      $share
        .text('PUBLISH')
        .removeClass('orange green')
        .addClass('green');
    } else {
      $vis_type
        .text('T')
        .removeClass('multi single')
        .addClass('single');
      $share
        .text('VISUALIZE')
        .removeClass('orange green')
        .addClass('orange');
    }
  },


  _addPrivacySelector: function(ev) {
    // ev.preventDefault();

    // this.privacy && this.privacy.clean();
    // cdb.god.trigger("closeDialogs");
    //     // Add privacy selector
    // var privacy = this.privacy = new cdb.admin.PrivacySelector({
    //   model: this.table,
    //   limitation: !this.options.user.get("private_tables"),
    //   direction: 'down',
    //   upgrade_url: 'https://' + config.account_host + "/account/" + user_data.username + "/upgrade"
    // });

    // cdb.god.bind("closeDialogs", this.privacy.hide, this.privacy);

    // this.$el.parent().append(this.privacy.render().el);

    // this.privacy.show($(ev.target),"offset");

    // return false;
  },

  _changeDescription: function(e) {
    // var self = this;
    // this.killEvent(e);
    // if(!this.table.sqlView) {
    //   this.description_dialog && this.description_dialog.clean();
    //   cdb.god.trigger("closeDialogs");

    //   var description_dialog = this.description_dialog = new cdb.admin.EditTextDialog({
    //     initial_value: this.table.get('description') || '',
    //     template_name: 'table/views/edit_name',
    //     clean_on_hide: true,
    //     maxLength: self._MAX_DESCRIPTION_LENGTH,
    //     modal_class: 'edit_name_dialog',
    //     res: function(val) {
    //       // safety check
    //       val = val.substr(0, self._MAX_DESCRIPTION_LENGTH);
    //       if (val !== self.model.get('description')) {
    //         // Show a loader, and when saves the new description
    //         // Take into account we don't trigger save event to
    //         // avoid change the whole application
    //         self.globalError.showError('Saving ... ', 'load');
    //         $.when(self.model.save({ description:val })).done(function() {
    //           self.globalError.showError('Saved', 'info', 3000);
    //         }).fail(function() {
    //           self.globalError.showError('Something has failed', 'error', 5000);
    //         });
    //       }
    //     }
    //   });

    //   cdb.god.bind("closeDialogs", description_dialog.hide, description_dialog);

    //   var pos = $(e.target).offset();
    //   pos.left -= $(window).scrollLeft();
    //   pos.top -= $(window).scrollTop();
    //   var w = Math.max($(e.target).width() + 100, 280);

    //   description_dialog.showAt(pos.left - 20, pos.top - 13, w);
    // }
  },

  _changeTitle: function(e) {
    // var self = this;
    // this.killEvent(e);
    // if(!this.table.sqlView) {
    //   this.title_dialog && this.title_dialog.clean();
    //   cdb.god.trigger("closeDialogs");
    //   var previousName = this.table.get('name');
    //   var title_dialog = this.title_dialog = new cdb.admin.EditTextDialog({
    //     initial_value: previousName,
    //     template_name: 'table/views/edit_name',
    //     clean_on_hide: true,
    //     modal_class: 'edit_name_dialog',
    //     res: function(val) {
    //       if (val !== self.model.get('name') && val != '') {

    //         var change_confirmation = new cdb.admin.BaseDialog({
    //           title: "Rename this table",
    //           description: "<strong>This change will affect you API calls.</strong> If you are accesing this table via API don't forget to update the name in the API calls after changing the name.",
    //           template_name: 'common/views/confirm_dialog',
    //           clean_on_hide: true,
    //           enter_to_confirm: true,
    //           ok_button_classes: "right button grey",
    //           ok_title: "Yes, do it",
    //           cancel_button_classes: "underline margin15",
    //           cancel_title: "Cancel",
    //           modal_type: "confirmation",
    //           width: 500
    //         });

    //         // If user confirms, app removes the row
    //         change_confirmation.ok = function() {
    //           self._renameTable(val)
    //         }

    //         change_confirmation
    //           .appendToBody()
    //           .open();
    //       }
    //     }
    //   });


    //   cdb.god.bind("closeDialogs", title_dialog.hide, title_dialog);

    //   // when the table has horizontal scroll for some reason
    //   // object offset returned has the scroll added
    //   var pos = $(e.target).offset();
    //   pos.left -= $(window).scrollLeft()
    //   pos.top -= $(window).scrollTop()
    //   var w = Math.max($(e.target).width() + 100, 280);
    //   title_dialog.showAt(pos.left - 20, pos.top - 6, w);
    // }
  },

  _renameTable: function(newName) {
    // var self = this;
    // self.globalError.showError('Renaming your table ... ', 'load', -1);
    // $.when(self.model.save({ name: newName }, {wait: true})).done(function() {
    //   self.globalError.showError('Saved', 'info', 3000);
    // });
  },

  _changeTags: function(e) {
    // var self = this;
    // e.preventDefault();
    // e.stopPropagation();
    // if(!this.table.sqlView) {
    //   this.tags_dialog && this.tags_dialog.clean();
    //   cdb.god.trigger("closeDialogs");

    //   var tags_dialog = this.tags_dialog = new cdb.admin.TagsDialog({
    //     initial_value: this.table.get('tags'),
    //     template_name: 'table/views/edit_name',
    //     clean_on_hide: false,
    //     modal_class: 'edit_name_dialog',
    //     res: function(val) {
    //       if (val !== self.model.get('tags')) {
    //         // Show a loader, and when saves new tags
    //         // Take into account we don't trigger save event to
    //         // avoid change the whole application (same as description)
    //         self.model.notice('Saving ... ', 'load');
    //         $.when(self.model.save({ tags:val })).done(function() {
    //           self.model.notice('Saved', 'info', 3000);
    //         }).fail(function() {
    //           self.model.notice('Something has failed', 'error', 5000);
    //         });
    //       }
    //     }
    //   });

    //   cdb.god.bind("closeDialogs", tags_dialog.hide, tags_dialog);

    //   // when the table has horizontal scroll for some reason
    //   // object offset returned has the scroll added
    //   var $tags = $(e.target).closest("span.tags")
    //   var pos = $tags.offset();
    //   pos.left -= $(window).scrollLeft();
    //   pos.top -= $(window).scrollTop() + 6;

    //   var w = Math.max($tags.find("p").width() + 100, 280);
    //   tags_dialog.showAt(pos.left - 10, pos.top - 5);
    // }
  }
});
