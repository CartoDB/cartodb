

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
    this.setWizard(this.options.wizard_option);
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


  _autocomplete: function($content) {
    var columns = this.model.nonReservedColumnNames()
      , self = this;
    columns = _(_.without(columns, 'the_geom'));

    var availableColumns = _.map(columns._wrapped, function(column, key) { var str = '{' + column + '}';  return str})
      , position = 0;

    function split( val ) {
      return val.split( /,\s*| \s*|\s* / );
    }
    function extractLast( term ) {
      return term.split( /,\s*| \s*/ ).pop();
    }

    $content.find("input.text")

      .bind( "keydown", function( ev ) {
        if ($( this ).data( "autocomplete" ).menu.active)
          ev.stopPropagation();

        if ( ev.keyCode === $.ui.keyCode.TAB && $( this ).data( "autocomplete" ).menu.active ) {
          ev.preventDefault();
        }

        if (ev.keyCode == 32 || ev.keyCode == 188 || ev.keyCode == 13 || ev.keyCode == $.ui.keyCode.TAB || ev.keyCode == 74 || ev.keyCode == 8) {
          var i_h = $content.find("p.hack")
            , text = $(this).val().substr(0,$(this).caret().end);
          
          i_h.text(text);
          position = Math.min(i_h.width() + 10, 180);
        }
      })

      .autocomplete({
        autoFocus: true,
        minLength: 1,
        source: function( request, response ) {
          response($.ui.autocomplete.filter(availableColumns, extractLast(request.term)));
          var l_ = parseInt($(this.menu.element).css('left').replace('px',''));
          $(this.menu.element).css({left:position + l_ + 'px'});
        },
        focus: function() {
          return false;
        },
        select: function( event, ui ) {
          var terms = split( this.value );

          // Check there was a comma after the term -> "term ," or "term,"
          for (term in terms) {
            var start = this.value.search(terms[term])
              , length = terms[term].length
              , pos = start + length;

            if (this.value.substr(pos,1) == "," || this.value.substr(pos,2) == " ,") {
              terms[term] += ",";
            }
          }

          terms.pop();
          terms.push( ui.item.value );
          terms.push( "" );
          this.value = terms.join(" ");
          return false;
        }
      });
  },


  render_content: function() {
    var $content = this.$content = $("<div>");
    var temp_content = this.getTemplate('table/views/georeference_dialog');
    $content.append(temp_content);

    this._fillColumnNames($content);
    this._autocomplete($content);

    if(this.options.georeference_column) {
      $content.find('.address input').val("{" + this.options.georeference_column + "}");
    }
    return $content;
  },

  
  clean: function() {
    var $column_autocomplete = this.$el.find("input.column_autocomplete");
    
    $column_autocomplete
      .unbind("keydown")
      .autocomplete("destroy");
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
