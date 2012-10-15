

cdb.admin.GeoreferenceDialog =  cdb.admin.BaseDialog.extend({

  // do not remove
  events: cdb.core.View.extendEvents({ }),

  initialize: function() {
    // dialog options
    _.extend(this.options, {
      title: 'Georeference your table',
      template_name: 'common/views/dialog_base',
      clean_on_hide: true,
      ok_button_classes: "button grey",
      ok_title: "Georeference",
      modal_type: "creation",
      modal_class: 'georeference_dialog',
      width: 572
    });
    this.constructor.__super__.initialize.apply(this);
    this.setWizard();
  },


  _fillColumnNames: function(el) {
    var columns = this.model.nonReservedColumnNames()
      , self = this;
    columns = _(_.without(columns, 'the_geom'));

    // smart selection .. JAJAJA
    this.latitude = '';
    if (columns.contains('lat')) {
      this.latitude = 'lat';
    } else if (columns.contains('latitude')) {
      this.latitude = 'latitude';
    } else {
      this.latitude = columns._wrapped[0];
    }

    this.longitude = '';
    if (columns.contains('lon')) {
      this.longitude = 'lon';
    } else if (columns.contains('longitude')) {
      this.longitude = 'longitude';
    } else {
      this.longitude = columns._wrapped[0];
    }

    // Apply CartoDB select style
    var $longitude = el.find(".column_selector:eq(0)")
      , longitude = new cdb.forms.Combo({
        el: el.find('#lon'),
        property: this.longitude,
        width: '162px',
        extra: columns._wrapped
      }).bind('change', function(longitude){
        self.longitude = longitude
      })

    this.addView(longitude);
    $longitude.append(longitude.render());

    var $latitude = el.find(".column_selector:eq(1)")
      , latitude = new cdb.forms.Combo({
        el: el.find('#lat'),
        property: this.latitude,
        width: '162px',
        extra: columns._wrapped
      }).bind('change', function(latitude){
        self.latitude = latitude
      })

    this.addView(latitude);
    $latitude.append(latitude.render());
  },


  render_content: function() {
    var $content = this.$content = $("<div>");
    var temp_content = this.getTemplate('table/views/georeference_dialog');
    $content.append(temp_content);

    this._fillColumnNames($content);
    return $content;
  },


  ok: function() {
    // use lat/lon
    if(this.option == 0) { // dont not change by ===
      this.model.geocode_using(this.latitude, this.longitude);
    } else {
      // geocoding using address
      if(this.option == 1) { // dont not change by ===
        this.options.geocoder.setAddress(this.$('.address input').val());
        this.options.geocoder.start();
      }
    }
  }
});
