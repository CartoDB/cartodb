
  /**
   *  Edit or show the metadata of a visualization
   *
   *  new cdb.admin.MetadataDialog({
   *    vis: visualization_model,
   *    user: user_model
   *  })
   *
   */

  cdb.admin.MetadataDialog = cdb.admin.BaseDialog.extend({

    events: {
      'click .save':    '_saveModel',
      'click .ok':      '_ok',
      'click .cancel':  '_cancel',
      'click .close':   '_cancel',
      'submit':         '_ok'
    },

    _TEXTS: {
      title: {
        table:  _t('Dataset metadata'),
        vis:    _t('Map metadata')
      },
      ok: _t('Save settings')
    },

    initialize: function() {
      _.bindAll(this, '_reInitScrollpane');

      // Generate new model
      this.vis = this.options.vis;
      this.user = this.options.user;
      this.model = _.clone(this.vis);
      // this.model.unset('id');
      delete this.model.id;;

      // Extend options
      _.extend(this.options, {
        title: this._TEXTS.title[ this.vis.isVisualization() ? 'vis' : 'table' ],
        description: '',
        width: 490,
        clean_on_hide: true,
        template_name: 'old_common/views/metadata_dialog_base',
        ok_title: this._TEXTS.ok,
        ok_button_classes: 'button grey',
        modal_class: 'metadata_dialog'
      });

      this.constructor.__super__.initialize.apply(this);
    },

    render: function() {
      this.$el.append(this.template_base( _.extend( this.options, this._getVisData() )));

      this.$(".modal").css({ width: this.options.width });
      this.render_content();

      if (this.options.modal_class) {
        this.$el.addClass(this.options.modal_class);
      }

      return this;
    },

    /**
     * Render the content for the metadata dialog
     */
    render_content: function() {
      var self = this;

      // Tags
      _.each(this.model.get('tags'), function(li) {
        this.$("ul").append("<li>" + _.escape(li) + "</li>");
      }, this);

      this.$("ul").tagit({
        allowSpaces:      true,
        readOnly:         !this._isMetadataEditable(),
        afterTagAdded:    this._reInitScrollpane,
        afterTagRemoved:  this._reInitScrollpane,
        onBlur: function() {
          self.$('ul').removeClass('focus')
        },
        onFocus: function() {
          self.$('ul').addClass('focus')
        },
        onSubmitTags: this.ok
      });

      // jScrollPane
      setTimeout(function() {
        self.$('.metadata_list').jScrollPane({ verticalDragMinHeight: 20 });

        // Gradients
        var gradients = new cdb.common.ScrollPaneGradient({
          list: self.$('.metadata_list')
        });
        self.$('.metadata_list').append(gradients.render().el);
        self.addView(gradients);
      },0);

      return false;
    },

    _getVisData: function() {
      return {
        vis: {
          name:             this.model.get('name'),
          title:            this.model.get('title'),
          description:      this.model.get('description'),
          max_length:       this.options.maxLength,
          tags:             '',
          license:          this.model.get('license'),
          source:           this.model.get('source'),
          isTitleEditable:  this._isTitleEditable(),
          isMetaEditable:   this._isMetadataEditable(),
          isOwner:          this.model.permission.isOwner(this.user),
          owner:            this.model.permission.owner.renderData(this.user),
          internal:         this.user.get('account_type').toLowerCase() === "internal"
        }
      }
    },

    /**
     *  Check if visualization/table (tags, description,
     *  source, license,...etc) are editable:
     *
     *  - Table with write permissions
     *  - Table synced
     *  - Any visualization
     */

    _isMetadataEditable: function() {
      if (this.model.isVisualization()) {
        if (this.model.permission.isOwner(this.user)) {
          return true;
        } else {
          return false;
        }
      } else {
        var lastDataLayer = this.vis.map.layers &&
          _.last(this.vis.map.layers.getDataLayers());
        var table = lastDataLayer && lastDataLayer.table;
        if (!table) {
          return false;
        } else if (table && (table.isInSQLView() || !table.permission.isOwner(this.user))) {
          return false;
        } else {
          return true;
        }
      }
    },

    // Check if visualization/table title is editable
    _isTitleEditable: function() {
      if (this.model.isVisualization()) {
        if (this.model.permission.isOwner(this.user)) {
          return true;
        } else {
          return false;
        }
      } else {
        var lastDataLayer = this.vis.map.layers &&
          _.last(this.vis.map.layers.getDataLayers());
        var table = lastDataLayer && lastDataLayer.table;

        if (!table) {
          return false;
        } else if (table && (table.isReadOnly() || !table.permission.isOwner(this.user))) {
          return false;
        } else {
          return true;
        }
      }
    },

    _reInitScrollpane: function() {
      this.$('.metadata_list').data('jsp') &&
      this.$('.metadata_list').data('jsp').reinitialise();
    },

    _keydown: function(e) {
      if (e.keyCode === 27) this._cancel()
    },

    _isNameValid: function(title) {
      if (title === "") {
        return false
      }
      return true
    },

    _getFormData: function() {
      var o = {};

      // Serialize form
      _.each(this.$('form').serializeArray(), function(i) {
        o[i.name] = i.value;
      });

      // Clean description
      o.description = cdb.Utils.removeHTMLEvents( cdb.Utils.stripHTML(o.description) );

      // Get tags
      o.tags = this.$('ul').tagit("assignedTags");

      return o
    },

    _saveModel: function(e) {
      if (e) this.killEvent(e);

      if (this.options.onResponse) {
        this.options.onResponse(this._getFormData());
      }

      this.hide();
    },

    _ok: function(e) {
      this.killEvent(e);
      var name = this.$('input[name="name"]').val();
      var hasNameChanged = this.model.get('name') !== name;
      var isNameValid = this._isNameValid(name);

      // Check if name is valid
      if (!isNameValid) {
        this._showNameError();
        return false;
      } else {
        this._hideNameError();
      }

      // Check if table name change confirmation is needed
      if (!this.model.isVisualization() && hasNameChanged) {
        this._showConfirmation();
      } else {
        this._saveModel();
      }
    },

    _showConfirmation: function() {
      var view = cdb.editor.ViewFactory.createDialogByTemplate('common/dialogs/confirm_rename_dataset');
      var self = this;
      view.ok = function() {
        self._saveModel();
        this.close();
      };
      view.appendToBody();
    },

    _showNameError: function() {
      this.$('.info.error').addClass('active');
      setTimeout(this._reInitScrollpane, 400);
    },

    _hideNameError: function() {
      this.$('.info.error').removeClass('active');
      setTimeout(this._reInitScrollpane, 400);
    },

    // Clean methods
    _destroyCustomElements: function() {
      // Destroy tagit
      this.$('ul').tagit('destroy');
      // Destroy jscrollpane
      this.$('.metadata_list').data() && this.$('.metadata_list').data().jsp && this.$('.metadata_list').data().jsp.destroy();
    },

    clean: function() {
      this._destroyCustomElements();
      cdb.admin.BaseDialog.prototype.clean.call(this);
    }

  });
