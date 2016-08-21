
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
    visualization: {
      loader:       _t('Changing to visualization'),
      created:      _t('Visualization created')
    },
    share: {
      export:        _t('EXPORT'),
      visualize:    _t('VISUALIZE')
    },
    share_privacy: {
      ok_next:      _t('Share it now!')
    }
  },

  _MAX_DESCRIPTION_LENGTH: 200,

  events: {
    'click a.options':      '_openOptionsMenu',
    'click a.share':        '_shareVisualization',
    'click a.privacy':      '_showPrivacyDialog',
    'click header nav a':   '_onTabClick',
    'click .add_new_layer': '_addLayerDialog',
    'click .add_overlay':   'killEvent',
    'click .do_export':     '_doExport',
    'click .cancel':        '_cancelExport'
  },

  initialize: function(options) {

    _.bindAll(this, '_setPrivacy');

    this.$body = $('body');
    this.dataLayer = null;
    this.globalError = this.options.globalError;
    this.mapTab = this.options.mapTab;
    this.visualization = this.options.visualization;
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
      vis: this.options.visualization,
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

    if (this.$('a.share').hasClass('disabled')) {
      return;
    }

    var view;
    if (this.model.isVisualization()) {
      cdb.god.trigger('export_image_clicked', e);
    } else {
      view = new cdb.editor.CreateVisFirstView({
        clean_on_hide: true,
        enter_to_confirm: true,
        model: this.model,
        router: window.table_router,
        title: 'A map is required to publish',
        explanation: 'A map is a shareable mix of layers, styles and queries. You can view all your maps in your dashboard.'
      });
      view.appendToBody();
    }
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
    this._setSyncInfo();
    this._setVisualization();
  },

  /**
   *  Set editable visualization info
   */
  setEditableInfo: function() {
    this._setSyncInfo();
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
   *  Set visualization type and change share button
   */
  _setVisualization: function() {
    // Change visualization type
    var $back            = this.$('a.back');
    var $share           = this.$('a.share');
    var is_visualization = this.model.isVisualization();

    if (is_visualization) {
      $share.find("span").text(this._TEXTS.share.export);
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

  addOverlaysDropdown: function() {
    $(".add_overlay, a.share").removeClass('disabled');

    if (!this.overlaysDropdown) {

      this.overlaysDropdown = new cdb.admin.OverlaysDropdown({
        vis: this.model,
        canvas: this.mapTab.getCanvas(),
        mapView: this.mapTab.getMapView(),
        target: $('.add_overlay'),
        position: "position",
        collection: this.visualization.overlays,
        template_base: "table/views/widget_dropdown",
        tick: "left",
        horizontal_position: "left",
        horizontal_offset: "40px"
      });

      this.addView(this.overlaysDropdown);

      this.overlaysDropdown.bind("onOverlayDropdownOpen", function(){
        this.slidesPanel && this.slidesPanel.hide();
        this.exportImageView && this.exportImageView.hide();
      }, this);

      cdb.god.bind("closeDialogs", this.overlaysDropdown.hide, this.overlaysDropdown);
      cdb.god.bind("closeOverlayDropdown", this.overlaysDropdown.hide, this.overlaysDropdown);

      $(".add_overlay").append(this.overlaysDropdown.render().el);
    }

  },

  clearDropdown: function() {
    $(".add_overlay, a.share").addClass('disabled');

    if (this.overlaysDropdown) {
      this.overlaysDropdown.clean();
      delete this.overlaysDropdown;
    }
  },

  setupOverlays: function() {
    var type = this.visualization.get("type");

    if (type !== "table") {
    }
  },

  toggleOverlaysDropdown: function(tab) {
    $(".add_overlay, a.share").toggleClass('disabled', tab === "table");

    if (tab !== "table") {
      this.addOverlaysDropdown();
    } else {
      this.clearDropdown();
      //$(".add_overlay .widgets_dropdown").remove();
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
  },


  _addLayerDialog: function(e) {
    this.killEvent(e);

    if (!this.options.user.canAddLayerTo(this.visualization.map)) {
      var dlg = new cdb.editor.LimitsReachView({
        clean_on_hide: true,
        enter_to_confirm: true,
        user: this.options.user
      });
      dlg.appendToBody();
      return;
    }

    if (this.model.isVisualization()) {
      this._createAddLayerDialog();
    } else {
      this.createVisDlg = new cdb.editor.CreateVisFirstView({
        clean_on_hide: true,
        enter_to_confirm: true,
        model: this.model,
        router: window.table_router,
        title: 'A map is required to add layers',
        explanation: 'A map is a shareable mix of layers, styles and queries. You can view all your maps in your dashboard.',
        success: this._createAddLayerDialog.bind(this)
      });
      this.createVisDlg.appendToBody();
    }
  },


  _createAddLayerDialog: function () {
    var model = new cdb.editor.AddLayerModel({}, {
      vis: this.visualization,
      map: this.visualization.map,
      user: this.options.user
    });
    var dialog = new cdb.editor.AddLayerView({
      model: model,
      user: this.options.user
    });
    dialog.appendToBody();
  },


  _doExport: function(e) {
    // NOTE: This is calling a private function from the mapTab because the
    // logic for the Export toolbar is still handled in that view. It doesn't
    // make conceptual sense for this method to be made public, but because
    // Backbone view events only apply to events from within their DOM element
    // the header needs to handle click events for MapTab concepts.
    // I'm not advocating that this is good, but the alternative is way more
    // work than it's worth.
    this.mapTab._doExport(e);
  },


  _cancelExport: function (e) {
    // NOTE: This is calling a private function from the mapTab because the
    // logic for the Export toolbar is still handled in that view. It doesn't
    // make conceptual sense for this method to be made public, but because
    // Backbone view events only apply to events from within their DOM element
    // the header needs to handle click events for MapTab concepts.
    // I'm not advocating that this is good, but the alternative is way more
    // work than it's worth.
    this.mapTab._cancelExport(e);
  }

});
