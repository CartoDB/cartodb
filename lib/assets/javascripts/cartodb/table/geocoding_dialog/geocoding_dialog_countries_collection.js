
  /**
   *  Geocoding countries collection
   *
   */

  cdb.admin.GeocodingDialog.Content.Countries = Backbone.Collection.extend({

    url: function(method) {
      var version = cdb.config.urlVersion('geocoding', method);
      return "/api/" + version + "/geocodings/get_countries/";
    }

  });
