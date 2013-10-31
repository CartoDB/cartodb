
  // - invalidate map when finish or error or cancel.


  /**
   *  
   *  
   */

  cdb.admin.BackgroundTab = cdb.core.View.extend({

    initialize: function() {
      this.initBinds();
      this.initBackground();
    }, 

    render: function() {},

    initBinds: function() {
      var self = this;

      this.model.bind('change:formatter', this._onChangeFormatter, this);
      this.model.bind("geocodingComplete geocodingError geocodingReset geocodingCanceled", function(e){
        self.resetGeocoder();
        self.model.destroyCheck();
      },this);
    },

    initBackground: function() {
      // Background geocoder
      var bkg_geocoder = this.bkg_geocoder = new cdb.admin.BackgroundGeocoder({
        template_base: 'table/views/geocoder_progress',
        model: this.model
      });
      this.$el.append(this.bkg_geocoder.render().el);
      bkg_geocoder.bindGeocoder();
    },

    setActiveLayer: function(layerView, layer) {
      this.resetGeocoder();
      this.table = layerView.table;
      // Check actual table if there is any pending geocodification.
      this.getGeocodifications();
    },

    _onChangeFormatter: function() {
      var self = this;

      this.model.set('table_name', this.table.get('id'));
      
      this.model.save(null, {
        success: function(r) {
          self.model.pollCheck();
        }
      });
    },






    resetGeocoder: function() {
      this.model.clear({ silent: true });
    },

    getGeocodifications: function() {
      if (this.geocodings) {
        this.checkGeocodification();
      } else {
        var self = this;
        var geocodings = new cdb.admin.Geocodings();
        geocodings.fetch({
          success: function(r) {
            self.geocodings = new Backbone.Collection(r.geocodings);
            self.checkGeocodification();
          },
          error: function(e) {
            self.geocodings = new Backbone.Collection();
            cdb.log.info('Geocoding API is not working! -> getGeocodifications')
          }
        })
      }
    },

    checkGeocodification: function() {

    }



  });