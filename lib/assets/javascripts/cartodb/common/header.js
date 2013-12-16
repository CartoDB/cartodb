
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
    description: {
      normal:       _t('add a description...'),
      query:        _t('there is no description...')
    },
    saving:         _t('Saving...'),
    saved:          _t('Saved'),
    error:          _t('Something went wrong, try again later'),
    tags: {
      add:          _t('add tags'),
      edit:         _t('edit tags'),
      query:        _t('no tags')
    },
    visualization: {
      loader:       _t('Changing to visualization'),
      created:      _t('Visualization created')
    },
    share: {
      publish:      _t('PUBLISH'),
      visualize:    _t('VISUALIZE')
    },
    share_privacy: {
      ok_next:      _t('Share it now!')
    },
    rename: {
      title:        _t('Rename your {{ vis }}'),
      desc_table:   _t('<strong>This change will affect your API calls.</strong> If you are accessing \
                    this table via API don\'t forget to update the name in the API calls after \
                    changing the name.'),
      desc_vis:     _t('<strong>This change will affect your embed maps and vizjson url.</strong> If you have published \
                    this visualization don\'t forget to check the url and replace the name.'),
      ok:           _t('Yes, do it')
    }
  },

  _PRIVACY_VALUES: ['public','private'],

  _MAX_DESCRIPTION_LENGTH: 200,

  events: {
    'click a.status':       '_changePrivacy',
    'click a.title':        '_changeTitle',
    'click .description a': '_changeDescription',
    'click span.tags > *':  '_changeTags',
    'click a.options':      '_openOptionsMenu',
    'click a.share':        '_shareVisualization',
    'click header nav a':   '_onTabClick'
  },

  initialize: function(options) {
    _.bindAll(this, '_changeTitle', '_setDescription', '_setTags');
    var self = this;

    this.$body = $('body');
    this.dataLayer = null;
    this.globalError = this.options.globalError;
    this.createBindings();

    // Display all the visualization info
    this.setInfo();
  },

  // Set new dataLayer from the current layerView
  setActiveLayer: function(layerView) {
    // Clean before bindings
    if (this.dataLayer) {
      this.dataLayer.unbind('applySQLView applyFilter errorSQLView clearSQLView', this.setEditableInfo,  this);
      this.dataLayer.table.unbind('change:isSync', this.setEditableInfo, this);
    }

    // Set new datalayer
    this.dataLayer = layerView.model;

    // Apply bindings if model is not a visualization
    if (!this.model.isVisualization()) {
      this.dataLayer.bind('applySQLView applyFilter errorSQLView clearSQLView', this.setEditableInfo,  this);
      this.dataLayer.table.bind('change:isSync', this.setEditableInfo, this);
      this.setEditableInfo();
    }
    
  },

  createBindings: function() {
    this.model.bind('change:name',        this._setName,        this);
    this.model.bind('change:description', this._setDescription, this);
    this.model.bind('change:tags',        this._setTags,        this);
    this.model.bind('change:privacy',     this._setPrivacy,     this);
    this.model.bind('change:type',        this.setInfo,         this);
  },

  _openOptionsMenu: function(e) {
    this.killEvent(e);

    // Options menu
    var options_menu = new cdb.admin.HeaderOptionsMenu({
      target: $(e.target),
      model: this.model,
      dataLayer: this.dataLayer,
      user: this.options.user,
      geocoder: this.options.geocoder,
      globalError: this.options.globalError,
      template_base: 'table/header/views/options_menu'
    }).bind("onDropdownShown",function(ev) {
      cdb.god.unbind("closeDialogs", options_menu.hide, options_menu);
      cdb.god.trigger("closeDialogs");
      cdb.god.bind("closeDialogs", options_menu.hide, options_menu);
    }).bind('onDropdownHidden', function() {
      cdb.god.unbind(null, null, options_menu);
    });

    this.$body.append(options_menu.render().el);
    options_menu.open(e);
  },

  /**
   *  Share visualization function, it could show
   *  the name dialog to create a new visualization
   *  or directly the share dialog :).
   */
  _shareVisualization: function(e) {
    this.killEvent(e);

    this.controller && this.controller.clean();
    this.controller = new cdb.admin.ShareController({
      model:  this.model,
      user:   this.options.user,
      config: this.options.config
    });
  },

  /**
   *  Set visualization info
   */
  setInfo: function() {
    this._setName();
    this._setPrivacy();
    this._setDescription();
    this._setTags();
    this._setSyncInfo();
    this._setVisualization();
  },

  /**
   *  Set editable visualization info
   */
  setEditableInfo: function() {
    this._setName();
    this._setDescription();
    this._setTags();
    this._setSyncInfo();
  },

  /**
   *  Set layer sync info if it is needed
   */
  _setSyncInfo: function() {
    this.sync_info && this.sync_info.clean();

    if (!this.model.isVisualization() && this.isSyncTable()) {
      this.$el.addClass('synced');

      this.sync_info = new cdb.admin.SyncInfo({
        table: this.dataLayer.table
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

    document.title = this.model.get('name') + " | CartoDB";
  },

  /**
   *  Set privacy status of the visualization
   */
  _setPrivacy: function() {
    var $status = this.$('a.status');

    for(var n in this._PRIVACY_VALUES) {
      var privacyName = this._PRIVACY_VALUES[n]
      $status.removeClass(privacyName);
    }

    $status
      .addClass(this.model.get('privacy'))
      .html(this.model.get('privacy'))
      .show();
  },

  /**
   *  Set visualization description in the header
   */
  _setDescription: function() {
    var default_description = "<i>" + (this.isVisEditable() ? this._TEXTS.description.normal : this._TEXTS.description.query ) + "</i>";
    var content = cdb.Utils.stripHTML(this.model.get('description'), '') || default_description;

    this.$('div.description p')
      .html(this.isVisEditable() ? '<a href="#/change-description">' + content + '</a>' : content );
  },

  /**
   *  Set visualization tags in the header
   */
  _setTags: function() {
    var tag_button_text = this._TEXTS.tags.add
      , tags = this.model.get('tags')
      , isEditable = this.isVisEditable();

    if (tags && tags.length > 0 && isEditable) {
      tag_button_text = this._TEXTS.tags.edit;
    } else if (tags && tags.length == 0 && !isEditable) {
      tag_button_text = this._TEXTS.tags.query;
    }

    if (tags && tags.length > 0) {
      var i = _.size(tags);
      var word = (i == 1) ? "tag" : "tags";
      var count = "<a href='#/edit-tags'>" + i + " " + word + "</a>";

      this.$('span.tags')
        .removeClass("empty")
        .html(count);
    } else {
      this.$('span.tags')
        .addClass("empty")
        .html("<a href='#/add-tags'>" + tag_button_text + "</a>");
    }

    this.$('span.tags a')[isEditable ? 'removeClass' : 'addClass']('disabled')
  },

  /**
   *  Set visualization type and change share button
   */
  _setVisualization: function() {
    // Change visualization type
    var $vis_type        = this.$('span.type')
      , $share           = this.$('a.share')
      , $back            = this.$('a.back')
      , $table_tab       = this.$('nav a').first()
      , is_visualization = this.model.isVisualization();

    if (is_visualization) {
      $vis_type
        .text('V')
        .removeClass('derived table')
        .addClass('derived');
      $share
        .text(this._TEXTS.share.publish)
        .removeClass('orange green')
        .addClass('green');
      $back
        .attr("href", "/dashboard/visualizations");

    } else {
      $vis_type
        .text('T')
        .removeClass('derived table')
        .addClass('table');
      $share
        .text(this._TEXTS.share.visualize)
        .removeClass('orange green')
        .addClass('orange');
      $back
        .attr("href", "/dashboard/tables");
    }
  },

  /**
   *  Change privacy of the visualization
   */
  _changePrivacy: function(ev) {
    ev.preventDefault();

    this.privacy && this.privacy.clean();
    cdb.god.trigger("closeDialogs");

    // Add privacy selector
    var privacy = this.privacy = new cdb.admin.PrivacySelector({
      model: this.model,
      limitation: !this.options.user.get("actions").private_tables,
      direction: 'down',
      upgrade_url: window.location.protocol + '//' + config.account_host + "/account/" + user_data.username + "/upgrade"
    });

    cdb.god.bind("closeDialogs", this.privacy.hide, this.privacy);

    // Set position and show privacy selector
    this.$el.parent().append(this.privacy.render().el);
    this.privacy.show($(ev.target),"offset");

    return false;
  },

  /**
   *  Change visualization description
   */
  _changeDescription: function(e) {
    var self = this;
    this.killEvent(e);

    if (this.isVisEditable()) {
      this.description_dialog && this.description_dialog.clean();
      cdb.god.trigger("closeDialogs");

      var description_dialog = this.description_dialog = new cdb.admin.EditTextDialog({
        initial_value: this.model.get('description') || '',
        template_name: 'table/views/edit_name',
        clean_on_hide: true,
        maxLength: this._MAX_DESCRIPTION_LENGTH,
        modal_class: 'edit_name_dialog',
        onResponse: function(val) {
          // Sanitize description (html and events)
          var description = cdb.Utils.removeHTMLEvents( cdb.Utils.stripHTML(val,'<a>') );
          self._onSetAttribute('description', description);
        }
      });

      cdb.god.bind("closeDialogs", description_dialog.hide, description_dialog);

      // Set position and show it
      var pos = $(e.target).offset();
      pos.left -= $(window).scrollLeft();
      pos.top -= $(window).scrollTop();
      var w = Math.max($(e.target).width() + 100, 280);
      description_dialog.showAt(pos.left - 20, pos.top - 15, w);
    }
  },

  /**
   *  Change visualization title
   */
  _changeTitle: function(e) {
    var self = this;
    this.killEvent(e);

    if (this.isVisEditable() && !this.isSyncTable()) {
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
    }

    function setTitle(val) {
      if (val !== self.model.get('name') && val != '') {

        var change_confirmation = new cdb.admin.BaseDialog({
          title: self._TEXTS.rename.title.replace('{{ vis }}', ( self.model.isVisualization() ? "visualization" : "table" )),
          description: self._TEXTS.rename['desc_' + (self.model.isVisualization() ? "vis" : "table")],
          template_name: 'common/views/confirm_dialog',
          clean_on_hide: true,
          enter_to_confirm: true,
          ok_button_classes: "right button grey",
          ok_title: self._TEXTS.rename.ok,
          cancel_button_classes: "underline margin15",
          modal_type: "confirmation",
          width: 500
        });

        // If user confirms, app set the new name
        change_confirmation.ok = function() {
          // Sanitize description (html and events)
          var title = cdb.Utils.stripHTML(val,'');
          self._onSetAttribute('name', title);
        }

        change_confirmation
          .appendToBody()
          .open();
      }
    }
  },

  /**
   *  Change visualization tags
   */
  _changeTags: function(e) {
    var self = this;
    e.preventDefault();
    e.stopPropagation();
    if (this.isVisEditable()) {
      this.tags_dialog && this.tags_dialog.clean();
      cdb.god.trigger("closeDialogs");

      var tags_dialog = this.tags_dialog = new cdb.admin.TagsDialog({
        initial_value: this.model.get('tags'),
        template_name: 'table/views/edit_name',
        clean_on_hide: true,
        modal_class: 'edit_name_dialog',
        onResponse: function(val) {
          self._onSetAttribute('tags', val);
        }
      });

      cdb.god.bind("closeDialogs", tags_dialog.hide, tags_dialog);

      // Set position and show it
      var $tags = $(e.target).closest("span.tags")
      var pos = $tags.offset();
      pos.left -= $(window).scrollLeft();
      pos.top -= $(window).scrollTop() + 6;
      var w = Math.max($tags.find("p").width() + 100, 280);
      tags_dialog.showAt(pos.left - 10, pos.top - 5);
    }
  },

  /**
   *  Wait function before set new visualization attributes
   */
  _onSetAttribute: function(attr, value) {
    if (!_.isEqual(this.model.get(attr),value)) {
      var self = this;

      var old_attrs = {};
      old_attrs[attr] = this.model.get(attr);

      var attrs = {};
      attrs[attr] = value;

      this.globalError.showError(this._TEXTS.saving, 'load', -1);

      this.model.save(attrs,{
        wait: true,
        success: function(m) {
          // Check if back has changed any attribute, due to
          // for example, a sanitizing process
          if (m.get(attr) != self.model.get('attr')) {
            self.model.set(m.toJSON(), { silent: true });
            self.setInfo();
          }

          // Check if attr saved is name to change url
          if (attr == "name" && !self.model.isVisualization()) {
            window.table_router.navigate(self._generateTableUrl(), {trigger: false});
            window.table_router.addToHistory();
          }
          
          self.globalError.showError(self._TEXTS.saved, 'info', 3000);
        },
        error: function(msg, resp) {
          var err =  resp && JSON.parse(resp.responseText).errors[0];
          self.globalError.showError(err, 'error', 3000);
          self.model.set(old_attrs, { silent: true });
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
      var table = this.model.map.layers && this.model.map.layers.last().table;

      if (!table) {
        cdb.log.info('Table model corrupted, there is 0 or more than one data layer added');
        return false;
      } else if (table && table.isInSQLView()) {
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
      url += '/tables/' + this.model.get('table').name;
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
