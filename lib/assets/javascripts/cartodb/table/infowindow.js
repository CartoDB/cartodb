/**
 * this infowindow is shown in the map when user clicks on a feature
 */

(function() {

  var MapInfowindow = cdb.geo.ui.Infowindow.extend({
    _TEXTS: {
      _NO_FIELDS_SELECTED: "You haven’t selected any <br/>infowindow fields."
    },

    events: cdb.core.View.extendEvents({
        'click .edit':    '_editGeom',
        'click .remove':  '_removeGeom'
    }),

    initialize: function() {
      var self = this;
      this.table = this.options.table;
      this.model.set({ content: 'loading...' });
      // call parent
      this.constructor.__super__.initialize.apply(this);
      this.model.set('offset', [28, 0]);
      this.model.bind('change:fields', function() {
        if(!this.hasChanged('content') && self.row) {
          self.renderInfo();
        }
      });


      // Set live tipsy when geom is enabled or disabled
      this.$el.find("a.edit, a.remove").tipsy({
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
            return ''
          } else {
            return 'Not available in SQL view'
          }
        }
      })
    },

    setFeatureInfo: function(cartodb_id) {
      this.cartodb_id = cartodb_id;
      if(this.row) {
        this.row.unbind();
      }
      this.row = this.table.data().getRow(cartodb_id);
      this.row.bind('change', this.renderInfo, this);
      this.row.fetch();
      this.model.set({ content: 'loading...' });
      return this;
    },

    /**
     * renders the infowindows adding some editing features
     */
    render: function() {
      // render original
      cdb.geo.ui.Infowindow.prototype.render.call(this);
      // render edit and remove buttons
      if(this.model.toJSON().fields && !this.model.toJSON().fields.length) {
        this.$('.cartodb-popup-content').html('<h4 class="noFields">' + this._TEXTS._NO_FIELDS_SELECTED + '</h4>');
        this.trigger('editInfoWindow');
      }
      var cartodb_id = '';
      if(this.row) {
        cartodb_id = this.row.attributes['cartodb_id'];
        cartodb_id = cartodb_id? '#'+cartodb_id : '';
      }
      this.$('.cartodb-popup-content-wrapper')
        .append(this.getTemplate('table/views/infowindow_footer')({"cartodb_id": cartodb_id}));

      if(this.table.data().isReadOnly()) {
        this.$('.cartodb-popup-content-wrapper .edit').addClass('disabled');
        this.$('.cartodb-popup-content-wrapper .remove').addClass('disabled');
      }

    },

    renderInfo: function() {
      var self = this;
      var fields = _(this.row.attributes).map(function(v, k) {
        // Don't rendering cartodb_id field from the beginning
        // although back is answering us with it
        if(self.model.containsField(k) && !_.contains(['the_geom', 'the_geom_webmercator', 'created_at', 'updated_at', 'cartodb_id', 'cartodb_georef_status'], k)) {
          var h = {
            title: null,
            value: '',
            position: Number.MAX_INT
          };
          if(self.model.getFieldProperty(k, 'title')) {
            h.title = k;
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
        }
      }
      this.model.set({ content:  { fields: render_fields } });

      // Just move the map if need it when fields are already added.
      this._adjustPan();
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
     * triggers an removeGeom event when the geometry
     * is removed from the server
     */
    _removeGeom: function(e) {

      e.preventDefault();

      if (!this.table.data().isReadOnly()) {
        var self = this;
        this.model.set("visibility", false);
        this.row.destroy({
          success: function() {
            self.trigger('removeGeom', self.row);
          }
        }, { wait: true });
        return false;
      }
    }
  });

  // export
  cdb.admin.MapInfowindow = MapInfowindow;

})();
