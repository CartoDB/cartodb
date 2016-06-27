/**
 * this infowindow is shown in the map when user clicks on a feature
 */

(function() {

  var MapInfowindow = cdb.geo.ui.Infowindow.extend({

    _TEXTS: {
      _NO_FIELDS_SELECTED:        _t("You haven’t selected any fields to be shown in the infowindow."),
      _NO_FIELDS_SELECTED_BUTTON: _t("Select fields")
    },

    _TEMPLATE_URL: 'table/views/infowindow/templates',

    events: cdb.core.View.extendEvents({
      'click .edit_data': '_editData',
      'click .edit_geo':  '_editGeom',
      'click .remove':    '_removeGeom',
      'click .open_infowindow_panel': '_openInfowindowPanel'
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

      this.table.bind('change:schema', this.render, this);
      this.add_related_model(this.table);

      // Create a help dialog for the infowindows with images
      if (this._containsCover) this._createHelpDialog();

      // Set live tipsy when geom is enabled or disabled
      this.$("div.cartodb-edit-buttons a.button").tipsy({
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
            return 'Not available in this mode'
          }
        }
      })
    },

    _createHelpDialog: function() {
      this.helpDialog = cdb.editor.ViewFactory.createDialogByTemplate('common/dialogs/help/infowindow_with_images', {}, { clean_on_hide: false });
      this.addView(this.helpDialog);
    },

    setFeatureInfo: function(cartodb_id) {
      // Set cartodb_id
      this.cartodb_id = cartodb_id;

      // render to update cartodb_id
      this.render();

      // Get row data and show the content
      if(this.row) {
        this.row.unbind(null, null, this);
      }
      this.row = this.table.data().getRow(cartodb_id, {
        no_add: true
      });

      this.row
        .bind('change', this.renderInfo, this)
        .fetch({ cache: false, no_geom: true });

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

      var fields = this.model.get('fields');

      // Show no_fields state when there isn't any field
      // and a custom template is not selected
      if((!fields || (fields && !fields.length)) && (!this.model.get('template'))) {

        // Add empty fields to the infowindow
        this.$('.cartodb-popup').addClass("no_fields");

        // Check if the infowindow has header or not
        var popup_class = '.cartodb-popup-content';
        if (this.$('.cartodb-popup-header').length > 0) {
          popup_class = '.cartodb-popup-header';
        }

        this.$(popup_class).html(
          '<p class="italic">' + this._TEXTS._NO_FIELDS_SELECTED + '</p>' +
          '<p><a class="margin5 underline open_infowindow_panel" href="#/select-fields">' + this._TEXTS._NO_FIELDS_SELECTED_BUTTON + '</a></p>'
        )
      } else {
        this.$('.cartodb-popup').removeClass("no_fields");
      }


      // render edit and remove buttons
      this.$('.cartodb-popup-content-wrapper')
        .append(this.getTemplate('table/views/infowindow/infowindow_footer')({ "cartodb_id": this.cartodb_id }));

      if (this.table.isReadOnly()) {
        this.$('.cartodb-popup-content-wrapper').find('a.remove, a.edit_data, a.edit_geo').addClass('disabled');
      }

      if (this._containsCover()) { // bind the help link to the helpDialog
        this.$(".image_not_found a.help").off("click");
        this.$(".image_not_found a.help").on("click", function() {
          $('body').append(self.helpDialog.render().el);
          self.helpDialog.open();
        });
      }

    },

    renderInfo: function() {
      var self = this;
      var row_attributes = self.row.attributes;
      var fields = [];

      for (var property in row_attributes) {
        if (row_attributes.hasOwnProperty(property)) {
          if (self.model.containsField(property) && !_.contains(self.model.SYSTEM_COLUMNS, property)) {
            var h = {
              title: self.model.getFieldProperty(property, 'title') ? property : null,
              value: row_attributes[property],
              position: self.model.getFieldPos(property)
            };

            fields.push(h);
          }
        }
      }

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
          //
          // header template use index to detect if it's the first element
          // renderer to use special style.
          // Mustache only matches as false a null, undefined or false value
          // so for the first element we set index as null
          // yes, very hacky :(
          f.index = render_fields.length ? render_fields.length: null,
          render_fields.push(f);
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
     *  Attempts to load the cover URL and show it
     */
    _loadCover: function() {
      var self = this;

      if (!this._containsCover()) return;

      var $cover = this.$(".cover");
      var $imageNotFound = this.$(".image_not_found");
      var $img = $cover.find("img");
      var url = this._getCoverURL();

      if (!this._isValidURL(url)) {
        $imageNotFound.fadeIn(250);
        $img.hide();
        return;
      }

      // configure spinner
      var
      target  = document.getElementById('spinner'),
      opts    = { lines: 9, length: 4, width: 2, radius: 4, corners: 1, rotate: 0, color: '#ccc', speed: 1, trail: 60, shadow: true, hwaccel: false, zIndex: 2e9 },
      spinner = new Spinner(opts).spin(target);

      // create the image
      $imageNotFound.hide();

      $img.hide(function() {
        this.remove();
      });

      $img = $("<img />").attr("src", url);
      $cover.append($img);

      $img.load(function(){
        spinner.stop();

        var w  = $img.width();
        var h  = $img.height();
        var coverWidth = $cover.width();
        var coverHeight = $cover.height();

        var ratio = h / w;
        var coverRatio = coverHeight / coverWidth;

        // Resize rules
        if ( w > coverWidth && h > coverHeight) { // bigger image
          if ( ratio < coverRatio ) $img.css({ height: coverHeight });
          else {
            var calculatedHeight = h / (w / coverWidth);
            $img.css({ width: coverWidth, top: "50%", position: "absolute", "margin-top": -1*parseInt(calculatedHeight, 10)/2 });
          }
        } else {
          var calculatedHeight = h / (w / coverWidth);
          $img.css({ width: coverWidth, top: "50%", position: "absolute", "margin-top": -1*parseInt(calculatedHeight, 10)/2 });
        }

        $img.fadeIn(300);
      })
      .error(function(){
        spinner.stop();
        $imageNotFound.fadeIn(250);
      });
    },


    /**
     * triggers an editGeom event with the geometry
     * infowindow is currently showing
     */
    _editGeom: function(e) {
      this.killEvent(e);
      if (!this.table.isReadOnly()) {
        this.model.set("visibility", false);
        this.trigger('editGeom', this.row);
      }
    },

    _editData: function(e) {
      this.killEvent(e);
      if (!this.table.isReadOnly()) {
        this.model.set("visibility", false);
        this.trigger('editData', this.row);
      }
    },

    _removeGeom: function(e) {
      this.killEvent(e);
      if (!this.table.isReadOnly()) {
        this.model.set("visibility", false);
        this.trigger('removeGeom', this.row);
      }
    },

    _openInfowindowPanel: function(e) {
      this.killEvent(e);
      this.trigger('openInfowindowPanel');
    },

    _getModelTemplate: function() {
      var template_name = cdb.admin.mod.TemplateMap[this.model.get("template_name")] || this.model.get("template_name");
      return this._TEMPLATE_URL + "/" + template_name;
    }

  });

  // export
  cdb.admin.MapInfowindow = MapInfowindow;

})();
