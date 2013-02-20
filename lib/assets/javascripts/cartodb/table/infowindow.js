/**
 * this infowindow is shown in the map when user clicks on a feature
 */

(function() {

  var MapInfowindow = cdb.geo.ui.Infowindow.extend({
    _TEXTS: {
      _NO_FIELDS_SELECTED: "You haven’t selected any <br/>infowindow fields."
    },

    events: cdb.core.View.extendEvents({
      'click .edit_data': '_editData',
      'click .edit_geo':  '_editGeom',
      'click .remove':    '_removeGeom'
    }),

    initialize: function() {
      var self = this;
      _.bindAll(this, '_removeGeom');
      this.table = this.options.table;
      this.model.set({ content: 'loading...' });
      // call parent
      this.constructor.__super__.initialize.apply(this);
      this.model.set('offset', [28, 0]);
      this.model.bind('change:fields', function() {

        if (!this.hasChanged('content') && self.row) {
          self.renderInfo();
        }

      });

      // Create a help dialog for the infowindows with images
      if (this._containsCover) this._createHelpDialog();

      // Set live tipsy when geom is enabled or disabled
      this.$el.find("div.cartodb-edit-buttons a.button").tipsy({
        live:true,
        fade:true,
        gravity: 's',
        offset: -2,
        className: function(){
          return $(this).closest(".cartodb-popup").hasClass('dark') ? 'dark' : ''
        },
        title: function(ev){
          var enabled = !$(this).hasClass("disabled");
          if (enabled) {
            return $(this).text()
          } else {
            return 'Not available in SQL view'
          }
        }
      })
    },

    _createHelpDialog: function() {

      var HelpDialog = cdb.admin.BaseDialog.extend({
        render_content: function() {
          return "<p>This template allows you to add an image to your infowindow.</p><p>The image URLs will need to be stored as a column in your table. Next, you will need to drag the URL field to the top of your infowindow.</p>";
        },
      });

      this.helpDialog = new HelpDialog({
        title: 'Adding images to your infowindows',
        ok_title: 'Ok, close',
        cancel_title: '',
        ok_button_classes: "button grey",
        modal_type: "compressed",
        width: 500
      });

      this.addView(this.helpDialog);

    },

    setFeatureInfo: function(cartodb_id) {
      // Set cartodb_id
      this.cartodb_id = cartodb_id;

      // Get row data and show the content
      if(this.row) {
        this.row.unbind();
      }
      this.row = this.table.data().getRow(cartodb_id);

      this.row
        .bind('change', this.renderInfo, this)
        .fetch();

      // trigger renderInfo now to render the actual contents
      this.renderInfo();

      return this;
    },

    /**
     * renders the infowindows adding some editing features
     */
    render: function() {

      var self = this;

      // render original
      cdb.geo.ui.Infowindow.prototype.render.call(this);

      // render edit and remove buttons
      if(this.model.toJSON().fields && !this.model.toJSON().fields.length) {

        // Add empty fields to the infowindow
        this.$el.find('.cartodb-popup').addClass("no_fields");

        // Check if the infowindow has header or not
        if (this.$('.cartodb-popup-header').length > 0) {
          this.$('.cartodb-popup-header').html('<h4>' + this._TEXTS._NO_FIELDS_SELECTED + '</h4>');
        } else {
          this.$('.cartodb-popup-content').html('<h4>' + this._TEXTS._NO_FIELDS_SELECTED + '</h4>');
        }
      } else {
        this.$el.find('.cartodb-popup').removeClass("no_fields");
      }

      var cartodb_id = '';

      if(this.row) {
        cartodb_id = this.row.attributes['cartodb_id'];
        cartodb_id = cartodb_id? '#'+cartodb_id : '';
      }

      this.$('.cartodb-popup-content-wrapper')
        .append(this.getTemplate('table/views/infowindow_footer')({"cartodb_id": cartodb_id}));

      if(this.table.data().isReadOnly()) {
        this.$('.cartodb-popup-content-wrapper').find('a.remove, a.edit_data, a.edit_geo').addClass('disabled');
      }

      if (this._containsCover()) { // bind the help link to the helpDialog
        this.$el.find(".image_not_found a.help").off("click");
        this.$el.find(".image_not_found a.help").on("click", function() {
          $('body').append(self.helpDialog.render().el);
          self.helpDialog.open();
        });
      }

    },

    renderInfo: function() {
      var self = this;
      var fields = _(this.row.attributes).map(function(v, k) {

        // Don't render cartodb_id field from the beginning
        // although back is answering us with it

        if (self.model.containsField(k) && !_.contains(self.model.SYSTEM_COLUMNS, k)) {

          var h = {
            title: null,
            value: '',
            position: Number.MAX_INT
          };

          if (self.model.getFieldProperty(k, 'title')) {
            // Removes the dashes from the titles
            h.title = k.replace(/_/g, " ");
          }

          h.value = v;

          h.position = self.model.getFieldPos(k);
          return h;
        }

        return null;

      });

      // sort
      fields = _.compact(fields);
      fields.sort(function(a, b) {
        return a.position - b.position;
      });

      // filter and add index
      var render_fields = [];
      for(var i = 0; i < fields.length; ++i) {
        var f = fields[i];
        if(f) {
          f.index = render_fields.length;
          render_fields.push(f);
          console.log(f);
        }
      }

      if (fields.length > 0) {
        // Set content
        this.model.set({ content:  { fields: render_fields } });
      } else {
        // Show loading due to the fact that we don't have the content yet
        this.setLoading();
      }

      if(this.model.get('visibility')) {
        // Just move the map if need it when fields are already added.
        this.adjustPan();
      }
    },

    /**
     * triggers an editGeom event with the geometry
     * infowindow is currently showing
     */
    _editGeom: function(e) {
      e.preventDefault();

      if (!this.table.data().isReadOnly()) {
        this.model.set("visibility", false);
        this.trigger('editGeom', this.row);
        return false;
      }
    },


    /**
     * Shows edit data modal window
     */
    _editData: function(e) {
      var self = this;
      e.preventDefault();

      if (!this.table.data().isReadOnly()) {

        var feature_edition_dialog = new cdb.admin.EditFeatureFields({
          model: this.row,
          table: this.table,
          res: function(data) {
            self.table.notice('Saving ... ', 'load');
            // Set row model
            this.model
              .set(data)
              .save({
                success: function() {
                  self.table.notice('Saved', 'info', 5000);
                },
                error: function() {
                  self.table.notice('Something has failed', 'error', 5000);
                },
              });
          }
        });

        feature_edition_dialog
          .appendToBody()
          .open({ center: true });

        return false;
      }
    },

    /**
     * triggers an removeGeom event when the geometry
     * is removed from the server
     */
    _removeGeom: function(e) {
      this.killEvent(e);
      if (!this.table.data().isReadOnly()) {
        var self = this;
        this.table.trigger('removing:row');
        this.model.set("visibility", false);
        this.row.destroy({
          success: function() {
            self.table.trigger('remove:row', self.row);
          }
        }, { wait: true });
        return false;
      }
    }
  });

  // export
  cdb.admin.MapInfowindow = MapInfowindow;

})();
