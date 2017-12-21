/**
 * this infowindow is shown in the map when user clicks on a feature
 */

(function() {

  cdb.open.PublicMapInfowindow = cdb.admin.MapInfowindow.extend({

    events: cdb.geo.ui.Infowindow.prototype.events,

    initialize: function() {
      var self = this;
      this.table = this.options.table;
      this.model.set({ content: 'loading...' });
      // call parent
      cdb.geo.ui.Infowindow.prototype.initialize.call(this);
    },

    render: function() {
      this.$el.html($(this.template(_.clone(this.model.attributes))));
      this._update();
      return this;
    },

    /**
     * Not in public
     */
    _editGeom: function(e) {

    },

    /**
     * Not in public
     */
    _removeGeom: function(e) {
    }


  });


})();
