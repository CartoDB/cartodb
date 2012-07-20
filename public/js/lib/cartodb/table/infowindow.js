/**
 * this infowindow is shown in the map when user clicks on a feature
 */

(function() {

  var MapInfowindow = cdb.geo.ui.Infowindow.extend({

    initialize: function() {
      this.table = this.options.table;
      this.model.set({ content: 'loading...' });
      // call parent
      this.constructor.__super__.initialize.apply(this);
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
      var html = _(this.row.attributes).map(function(v, k) {
        return '<h4>' + k + '</h4>' + '<p>' + v + '</p>';
      }).join('\n');
      this.model.set({ content: "<div>" + html + "</div>" });
    },

    render: function() {
      this.$el.html($(this.template(this.model.toJSON())));
      this._update();
      return this;
    }

  });


  cdb.admin.MapInfowindow = MapInfowindow;


})();
