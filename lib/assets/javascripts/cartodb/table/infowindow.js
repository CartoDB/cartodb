/**
 * this infowindow is shown in the map when user clicks on a feature
 */

(function() {

  var MapInfowindow = cdb.geo.ui.Infowindow.extend({

    initialize: function() {
      var self = this;
      this.table = this.options.table;
      this.model.set({ content: 'loading...' });
      // call parent
      this.constructor.__super__.initialize.apply(this);
      this.model.set('offset', [216/2, 0]);
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

    renderInfo: function() {
      var self = this;
      var fields = _(this.row.attributes).map(function(v, k) {
        if(self.model.containsField(k)) {
          var h = {
            title: null,
            value: ''
          };
          if(self.model.getFieldProperty(k, 'title')) {
            h.title = k;
          }
          h.value = v;
          return h;
        }
        return null;
      });
      var html = cdb.templates.getTemplate('table/views/infowindow_content')({
        fields: _.compact(fields)
      });
      this.model.set({ content: html });
    },

    render: function() {
      this.$el.html($(this.template(this.model.attributes)));
      this._update();
      return this;
    }

  });


  cdb.admin.MapInfowindow = MapInfowindow;


})();
