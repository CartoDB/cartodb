
  /**
   *  Edit or show the metadata of a visualization
   *
   *  new cdb.admin.MetadataDialog({
   *    vis: visualization_model,
   *    user: user_model
   *  })
   *
   */

  /*
    TODO
    - Check what to do when edition is finished
    - Specs
  */


  cdb.admin.MetadataDialog = cdb.admin.BaseDialog.extend({

    events: {
      'click .save':    '_saveModel',
      'click .ok':      '_ok',
      'click .cancel':  '_cancel',
      'click .close':   '_cancel',
      'submit':         '_ok'
    },

    initialize: function() {
      _.bindAll(this, '_reInitScrollpane');

      // Generate new model
      this.vis = this.options.vis;
      this.user = this.options.user;
      this.model = this.vis.clone();
      // this.model.unset('id');
      delete this.model.id;;

      // Extend options
      _.extend(this.options, {
        title: 'Table metadata',
        description: '',
        width: 490,
        clean_on_hide: true,
        template_name: 'common/views/metadata_dialog_base',
        ok_title: 'Save settings',
        ok_button_classes: 'button grey',
        modal_class: 'metadata_dialog'
      });

      this.constructor.__super__.initialize.apply(this);
    },

    render: function() {
      this.$el.append(this.template_base( _.extend( this.options, this._getVisData() )));

      this.$(".modal").css({ width: this.options.width });
      this.render_content();

      $(document).unbind('keydown', this._keydown);

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
        this.$("ul").append("<li>" + li + "</li>");
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
        var gradients = new cdb.admin.ScrollPaneGradient({
          list: self.$('.metadata_list')
        });
        self.$('.metadata_list').append(gradients.render().el);
        self.addView(gradients);
      },0);

      // Name error info
      // var error = new cdb.admin.ImportInfo({
      //   el:     this.$('div.infobox'),
      //   model:  this.model
      // });
      // this.addView(error);

      return false;
    },

    _getVisData: function() {
      return {
        vis: {
          name:             this.model.get('name'),
          description:      this.model.get('description'),
          max_length:       this.options.maxLength,
          tags:             '',
          license:          this.model.get('license'),
          source:           this.model.get('source'),
          isTitleEditable:  this._isTitleEditable(), 
          isMetaEditable:   this._isMetadataEditable(),
          isOwner:          this.model.permission.isOwner(this.user),
          owner:            this.model.permission.get('owner')
        }
      }
    },

    /**
     *  Check if visualization/table (tags, description, source, license,...etc) are editable
     *
     *  They will be editable when:
     *  
     *  - Table with write permissions
     *  - Table synced
     *  - Any visualization
     */

    _isMetadataEditable: function() {
      if (this.model.isVisualization()) {
        return true;
      } else {
        var table = this.vis.map.layers && this.vis.map.layers.last().table;

        if (!table) {
          cdb.log.info('Table model corrupted, there is 0 or more than one data layer added');
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
        return true;
      } else {
        var table = this.vis.map.layers && this.vis.map.layers.last().table;

        if (!table) {
          cdb.log.info('Table model corrupted, there is 0 or more than one data layer added');
          return false;
        } else if (table && (table.isReadOnly() || !table.permission.isOwner(this.options.user))) {
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

    _keydown: function() {},

    _showConfirmation: function() {
      this.$("section.modal:eq(0)")
        .animate({
          top:0,
          opacity: 0
        }, 300, function() {
          $(this).slideUp(300);
        });

      
      this.$(".modal.confirmation")
        .css({
          top: '50%',
          marginTop: this.$(".modal.confirmation").height() / 2,
          display: 'block',
          opacity: 0
        })
        .delay(200)
        .animate({
          marginTop: -( this.$(".modal.confirmation").height() / 2 ),
          opacity: 1
        }, 300);
    },

    _isValidTitle: function() {

    },

    _getFormData: function() {

    },

    _saveModel: function() {

      this.hide();
    },

    _ok: function(e) {
      this.killEvent(e);
      var value = "";

      if (!this.model.isVisualization() /*&& this.model.get('name') !== this.vis.get('name')*/) {
        this._showConfirmation();
      } else {
        this._saveModel();
      }
    },

    // Clean methods
    _destroyCustomElements: function() {
      // Destroy tagit
      this.$('ul').tagit('destroy');
      // Destroy jscrollpane
      this.$('.metadata_list').data().jsp && this.$('.metadata_list').data().jsp.destroy();
    },

    clean: function() {
      this._destroyCustomElements();
      cdb.admin.BaseDialog.prototype.clean.call(this);
    }
    
  });
