
/**
 *  Common header for vis view ( table | derived )
 *
 *  - It needs a visualization model, config and user data.
 *
 *    var header = new cdb.admin.Header({
 *      el:       this.$('header'),
 *      model:    visusalization_model,
 *      user:     user_model,
 *      config:   config,
 *      geocoder: geocoder
 *    });
 *
 */

cdb.admin.Header = cdb.core.View.extend({

  _TEXTS: {
    saving:         _t('Saving...'),
    saved:          _t('Saved'),
    error:          _t('Something went wrong, try again later'),
    metadata: {
      edit:         _t('Edit metadata...'),
      view:         _t('View metadata...')
    },
    visualization: {
      loader:       _t('Changing to visualization'),
      created:      _t('Visualization created')
    },
    share: {
      publish:        _t('PUBLISH'),
      visualize:    _t('VISUALIZE')
    },
    share_privacy: {
      ok_next:      _t('Share it now!')
    },
    rename: {
      readonly:     _t('It is not possible to rename<br/>the dataset in <%- mode %> mode'),
      owner:        _t('It is not possible to rename<br/>the dataset if you are not the owner')
    }
  },

  _MAX_DESCRIPTION_LENGTH: 200,

  events: {
    'click a.title':        '_changeTitle',
    'click .metadata a':    '_changeMetadata',
    'click a.options':      '_openOptionsMenu',
    'click a.share':        '_shareVisualization',
    'click a.privacy':      '_showPrivacyDialog',
    'click header nav a':   '_onTabClick'
  },

  initialize: function(options) {

    _.bindAll(this, '_changeTitle', '_setPrivacy');

    this.$body = $('body');
    this.dataLayer = null;
    this.globalError = this.options.globalError;
    this._initBinds();

    // Display all the visualization info
    this.setInfo();
  },

  // Set new dataLayer from the current layerView
  setActiveLayer: function(layerView) {
    // Clean before bindings
    if (this.dataLayer) {
      this.dataLayer.unbind('applySQLView applyFilter errorSQLView clearSQLView', this.setEditableInfo,  this);
      this.dataLayer.table.unbind('change:isSync', this.setEditableInfo, this);
      this.dataLayer.table.unbind('change:permission', this.setInfo, this);
    }

    // Set new datalayer
    this.dataLayer = layerView.model;

    // Apply bindings if model is not a visualization
    if (!this.model.isVisualization()) {
      this.dataLayer.bind('applySQLView applyFilter errorSQLView clearSQLView', this.setEditableInfo,  this);
      this.dataLayer.table.bind('change:isSync', this.setEditableInfo, this);
      this.dataLayer.table.bind('change:permission', this.setInfo, this);
      this.setEditableInfo();
    }

  },

  _initBinds: function() {
    this.model.bind('change:name',        this._setName,            this);
    this.model.bind('change:type',        this.setInfo,             this);
    this.model.bind('change:privacy',     this._setPrivacy,      this);
    this.model.bind('change:permission',  this._setSharedCount,  this);
  },

  _openOptionsMenu: function(e) {
    this.killEvent(e);

    var self = this;
    var $target = $(e.target);

    // Options menu
    this.options_menu = new cdb.admin.HeaderOptionsMenu({
      target: $(e.target),
      model: this.model, // master_vis
      dataLayer: this.dataLayer,
      user: this.options.user,
      private_tables: this.options.user.get("actions").private_tables,
      geocoder: this.options.geocoder,
      backgroundPollingModel: this.options.backgroundPollingModel,
      globalError: this.options.globalError,
      template_base: 'table/header/views/options_menu'
    }).bind("onDropdownShown",function(ev) {
      cdb.god.unbind("closeDialogs", self.options_menu.hide, self.options_menu);
      cdb.god.trigger("closeDialogs");
      cdb.god.bind("closeDialogs", self.options_menu.hide, self.options_menu);
    }).bind('onDropdownHidden', function() {
      this.clean();
      $target.unbind('click');
      cdb.god.unbind(null, null, self.options_menu);
    });

    this.$body.append(this.options_menu.render().el);
    this.options_menu.open(e);
  },

  /**
   *  Share visualization function, it could show
   *  the name dialog to create a new visualization
   *  or directly the share dialog :).
   */
  _shareVisualization: function(e) {
    this.killEvent(e);

    var view;
    if (this.model.isVisualization()) {
      view = new cdb.editor.PublishView({
        clean_on_hide: true,
        enter_to_confirm: true,
        user: this.options.user,
        model: this.model // vis
      });
    } else {
      view = new cdb.editor.CreateVisFirstView({
        clean_on_hide: true,
        enter_to_confirm: true,
        model: this.model,
        router: window.table_router,
        title: 'A map is required to publish',
        explanation: 'A map is a shareable mix of layers, styles and queries. You can view all your maps in your dashboard.'
      });
    }
    view.appendToBody();
  },

  _showPrivacyDialog: function(e) {
    if (e) this.killEvent(e);

    if (this.model.isOwnedByUser(this.options.user)) {
      var dialog = new cdb.editor.ChangePrivacyView({
        vis: this.model, //vis
        user: this.options.user,
        enter_to_confirm: true,
        clean_on_hide: true
      });
      dialog.appendToBody();
    }
  },

  /**
   *  Set visualization info
   */
  setInfo: function() {
    this._setName();
    this._setSyncInfo();
    this._setVisualization();
    this._setMetadata();
  },

  /**
   *  Set editable visualization info
   */
  setEditableInfo: function() {
    this._setName();
    this._setSyncInfo();
    this._setMetadata();
  },

  _setPrivacy: function() {

    var $share  = this.$('a.privacy');

    // Update shared count if it is neccessary
    this._setSharedCount();

    var privacy = this.model.get("privacy").toLowerCase();

    if (privacy == "public") {

      $share
      .removeClass("private")
      .removeClass("link_protected")
      .removeClass("password_protected")
      .removeClass("organization")
      .addClass("public");

    } else if (privacy == "link"){

      $share
      .removeClass("public")
      .removeClass("private")
      .removeClass("password_protected")
      .removeClass("organization")
      .addClass("link_protected");

    } else if (privacy == "private"){

      $share
      .removeClass("public")
      .removeClass("link_protected")
      .removeClass("password_protected")
      .removeClass("organization")
      .addClass("private");

    } else if (privacy == "password"){

      $share
      .removeClass("private")
      .removeClass("link_protected")
      .removeClass("public")
      .removeClass("organization")
      .addClass("password_protected");

    } else if (privacy == "organization"){

      $share
      .removeClass("private")
      .removeClass("link_protected")
      .removeClass("public")
      .removeClass("password_protected")
      .addClass("organization");

    }

    // User is owner of this visualization (table or derived)?
    var isOwner = this.model.permission.isOwner(this.options.user);
    $share.find('i')[ isOwner ? 'removeClass' : 'addClass' ]('disabled');

  },

  _setSharedCount: function() {
    var isOwner = this.model.permission.isOwner(this.options.user);
    var $share  = this.$('a.privacy i');

    $share.empty();

    if (isOwner) {
      var $count = $('<span>').addClass('shared_users');

      if (this.model.permission.acl.size() > 0) {
        // Get total shared users or if the whole organization has access
        var shared_users = 0;
        var users_perm = this.model.permission.getUsersWithAnyPermission();

        if (this.model.permission.isSharedWithOrganization()) {
          shared_users = 'ORG';
        } else {
          shared_users = users_perm.length;
        }

        $count.text( (shared_users !== 0) ? shared_users : '' );

        $share.append($count);
      }
    }
  },

  /**
   *  Change metadata link text
   */
  _setMetadata: function() {
    var isOwner = this.model.permission.isOwner(this.options.user);
    var $metadata = this.$('.metadata a');

    var text = this._TEXTS.metadata.edit;
    var href = "#/edit-metadata";

    if (!isOwner) {
      text = this._TEXTS.metadata.view;
      href = "#/view-metadata";
    }

    $metadata
      .attr('href', href)
      .text(text);
  },

  /**
   *  Set layer sync info if it is needed
   */
  _setSyncInfo: function() {
    this.sync_info && this.sync_info.clean();

    if (!this.model.isVisualization() && this.isSyncTable()) {
      this.$el.addClass('synced');

      this.sync_info = new cdb.admin.SyncInfo({
        dataLayer: this.dataLayer,
        user: this.options.user
      });

      this.$('.sync_status').append(this.sync_info.render().el);
      this.addView(this.sync_info);

    } else {
      this.$el.removeClass('synced');
    }
  },

  /**
   *  Set name of the visualization
   */
  _setName: function() {
    var $title = this.$('h1 a.title');

    $title
      [(this.isVisEditable() && !this.isSyncTable()) ? 'removeClass' : 'addClass' ]('disabled')
      .text(this.model.get('name'))

    document.title = this.model.get('name') + " | CARTO";
  },


  /**
   *  Set visualization type and change share button
   */
  _setVisualization: function() {
    // Change visualization type
    var $back            = this.$('a.back');
    var $share           = this.$('a.share');
    var is_visualization = this.model.isVisualization();

    if (is_visualization) {
      $share.find("span").text(this._TEXTS.share.publish);
      this._setPrivacy();
      var route = cdb.config.prefixUrl() + "/dashboard/maps";
      $back.attr("href", route );
    } else {
      $share.find("span").text(this._TEXTS.share.visualize);
      this._setPrivacy();
      var route = cdb.config.prefixUrl() + "/dashboard/datasets";
      $back.attr("href", route );
    }
  },

  /**
   *  Change visualization metadata
   */
  _changeMetadata: function(ev) {
    ev.preventDefault();

    var dlg = new cdb.editor.EditVisMetadataView({
      maxLength: this._MAX_DESCRIPTION_LENGTH,
      vis: this.model,
      dataLayer: this.dataLayer && this.dataLayer.table,
      user: this.options.user,
      clean_on_hide: true,
      enter_to_confirm: false,
      onShowPrivacy: this._showPrivacyDialog.bind(this),
      onDone: this._onChangeMetadata.bind(this)
    });

    dlg.appendToBody();
  },

  _onChangeMetadata: function(nameChanged) {
    // Check if attr saved is name to change url when
    // visualization is table type
    if (nameChanged && !this.model.isVisualization()) {
      window.table_router.navigate(this._generateTableUrl(), {trigger: false});
      window.table_router.addToHistory();
    }
  },

  /**
   *  Change visualization title
   */
  _changeTitle: function(e) {
    this.killEvent(e);

    var self = this;
    var isOwner = this.model.permission.isOwner(this.options.user);

    if (this.isVisEditable()) {
      this.title_dialog && this.title_dialog.clean();
      cdb.god.trigger("closeDialogs");

      var title_dialog = this.title_dialog = new cdb.admin.EditTextDialog({
        initial_value: this.model.get('name'),
        template_name: 'table/views/edit_name',
        clean_on_hide: true,
        modal_class: 'edit_name_dialog',
        onResponse: setTitle
      });

      cdb.god.bind("closeDialogs", title_dialog.hide, title_dialog);

      // Set position and show
      var pos = $(e.target).offset();
      pos.left -= $(window).scrollLeft()
      pos.top -= $(window).scrollTop()
      var w = Math.max($(e.target).width() + 100, 280);
      title_dialog.showAt(pos.left - 20, pos.top - 10, w);
    } else {
      var $el = $(e.target);
      $el
        .bind('mouseleave', destroyTipsy)
        .tipsy({
          fade:     true,
          trigger:  'manual',
          html:     true,
          title:    function() {
            var mode = self.isSyncTable() ? 'sync' : 'read-only';
            return _.template(self._TEXTS.rename[ !isOwner ? 'owner' : 'readonly' ])({ mode: mode })
          }
        })
        .tipsy('show')
    }

    function destroyTipsy() {
      var $el = $(this);
      var tipsy = $el.data('tipsy');
      if (tipsy) {
        $el
          .tipsy('hide')
          .unbind('mouseleave', destroyTipsy);
      }
    }

    function setTitle(val) {
      if (val !== self.model.get('name') && val != '') {
        // Sanitize description (html and events)
        var title = cdb.Utils.stripHTML(val,'');

        if (self.model.isVisualization()) {
          self._onSetAttributes({ name: title });
        } else {
          // close any prev modal if existing
          if (self.change_confirmation) {
            self.change_confirmation.clean();
          }
          self.change_confirmation = cdb.editor.ViewFactory.createDialogByTemplate('common/dialogs/confirm_rename_dataset');

          // If user confirms, app set the new name
          self.change_confirmation.ok = function() {
            self._onSetAttributes({ name: title });
            if (_.isFunction(this.close)) {
              this.close();
            }
          };

          self.change_confirmation
            .appendToBody()
            .open();
        }
      }
    }
  },



  /**
   *  Wait function before set new visualization attributes
   */
  _onSetAttributes: function(d) {

    var old_data = this.model.toJSON();
    var new_data = d;

    this.model.set(d, { silent: true });

    // Check if there is any difference
    if (this.model.hasChanged()) {
      var self = this;

      this.globalError.showError(this._TEXTS.saving, 'load', -1);

      this.model.save({},{
        wait: true,
        success: function(m) {
          // Check if attr saved is name to change url
          if (new_data.name !== old_data.name && !self.model.isVisualization()) {
            window.table_router.navigate(self._generateTableUrl(), {trigger: false});
            window.table_router.addToHistory();
          }

          self.globalError.showError(self._TEXTS.saved, 'info', 3000);
        },
        error: function(msg, resp) {
          var err =  resp && JSON.parse(resp.responseText).errors[0];
          self.globalError.showError(err, 'error', 3000);
          self.model.set(old_data, { silent: true });
          self.setInfo();
        }
      });
    }


  },

  /**
   *  Check if visualization/table is editable
   *  (Checking if it is visualization and/or data layer is in sql view)
   */
  isVisEditable: function() {
    if (this.model.isVisualization()) {
      return true;
    } else {
      var table = this.dataLayer && this.dataLayer.table;

      if (!table) {
        return false;
      } else if (table && (table.isReadOnly() || !table.permission.isOwner(this.options.user))) {
        return false;
      } else {
        return true;
      }
    }
  },


  isSyncTable: function() {
    if (this.dataLayer && this.dataLayer.table) {
      return this.dataLayer.table.isSync();
    }
    return false;
  },


  _generateTableUrl: function(e) {
    // Let's create the url ourselves //
    var url = '';

    // Check visualization type and get table or viz id
    if (this.model.isVisualization()) {
      url += '/viz/' + this.model.get('id');
    } else {
      var isOwner = this.model.permission.isOwner(this.options.user);
      var table = new cdb.admin.CartoDBTableMetadata(this.model.get('table'));

      // Qualify table urls if user is not the owner
      if (!isOwner) {
        var owner_username = this.model.permission.owner.get('username');
        url += '/tables/' + owner_username + '.' + table.getUnqualifiedName();
      } else {
        url += '/tables/' + table.getUnqualifiedName();
      }
    }

    // Get scenario parameter from event or current url (table or map)
    var current = e ? $(e.target).attr('href') : window.location.pathname;
    if (current.search('/map') != -1) {
      url += '/map'
    } else {
      url += '/table'
    }

    return url;
  },


  _onTabClick: function(e) {
    e.preventDefault();
    window.table_router.navigate(this._generateTableUrl(e), {trigger: true});
  }
});
