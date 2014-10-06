
  /**
   *  Geocoding countries collection
   *
   */

  cdb.admin.GeocodingDialog.Content.Countries = Backbone.Collection.extend({

    url: "/api/v1/geocodings/get_countries/"

  });