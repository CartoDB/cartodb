/**
 * this infowindow is shown in the map when user clicks on a feature
 */

(function() {

  var MapInfowindow = cdb.geo.ui.Infowindow.extend({

    events: cdb.core.View.extendEvents({
        'click .edit': '_editGeom',
        'click .remove': '_removeGeom'
    }),

    initialize: function() {
      var self = this;
      this.table = this.options.table;
      this.model.set({ content: 'loading...' });
      // call parent
      this.constructor.__super__.initialize.apply(this);
      this.model.set('offset', [28, 0]);
      this.model.bind('change', function() {
        if(!this.hasChanged('content') && self.row) {
          self.renderInfo();
        }
      });
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


      console.log(this.model);
      window.debug = this;

      var cartodb_id = '';
      if(this.row) {
        cartodb_id = this.row.attributes['cartodb_id'];
        cartodb_id = cartodb_id? '#'+cartodb_id : '';
      }
      this.$('.cartodb-popup-content-wrapper')
        .append(this.getTemplate('table/views/infowindow_footer')({"cartodb_id": cartodb_id}));
    },

    renderInfo: function() {
      var self = this;
      var fields = _(this.row.attributes).map(function(v, k) {
        if(self.model.containsField(k)) {
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
    },

    /**
     * triggers an editGeom event with the geometry
     * infowindow is currently showing
     */
    _editGeom: function(e) {
      e.preventDefault();
      this.model.set("visibility", false);
      this.trigger('editGeom', this.row);
      return false;
    },

    /**
     * triggers an removeGeom event when the geometry
     * is removed from the server
     */
    _removeGeom: function(e) {
      var self = this;
      e.preventDefault();
      this.model.set("visibility", false);
      this.row.destroy({
        success: function() {
          self.trigger('removeGeom', self.row);
        }
      }, { wait: true });
      return false;
    }


  });

  // export
  cdb.admin.MapInfowindow = MapInfowindow;

})();
