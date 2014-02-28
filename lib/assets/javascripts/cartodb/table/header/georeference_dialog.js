
  /**
   *  Delete visualization dialog
   */

  cdb.admin.GeocoderMessageDialog = cdb.admin.BaseDialog.extend({

    initialize: function(options) {
      _.extend(this.options, {
        template_name: 'common/views/georeference_message',
        clean_on_hide: true,
        enter_to_confirm: true,
        ok_button_classes: "button grey",
        ok_title: "Continue",
        cancel_button_classes: "underline margin15",
        style: "points",
        modal_type: "notification",
        width: 514,
        modal_class: 'georeference_message_dialog'
      });

      this.constructor.__super__.initialize.apply(this);
    },

    animate: function() {
      this.$el.find(".opt").addClass("animated selected");
    },

    render_content: function() {
      return this.getTemplate('common/views/georeference_content_dialog')(this.options);
    }
  });

/**
 *  Georeference records from a table
 *
 *  - It needs at least a table model and a geocoder model.
 *
 *  Usage example:
 *
 *    var dialog = new cdb.admin.GeoreferenceDialog({
 *      table: table_model,
 *      option: 1,
 *      georeference_column: column_name,
 *      geocoder: geocoder
 *    });
 *
 */

cdb.admin.GeoreferenceStyles = cdb.core.View.extend({

  tagName: "ul",
  className: "georeference_styles",

  // do not remove
  events: cdb.core.View.extendEvents({
    "click .opt": "_onGeometryTypeClick",
    "click .learn_more": "_onLearnMoreClick"
  }),

  _TEXTS: {
    points: {
      enabled:  _t('Georeference your data with points'),
      disabled: _t('No point data available for your selection. <a href="#" class="learn_more">Learn more</a>'),
    },
    polygons: {
      enabled:  _t('Georeference your data with administrative regions'),
      disabled: _t('No polygon data available for your selection. <a href="#" class="learn_more">Learn more</a>'),
    }
  },

  template_name:  'table/header/views/georeference_styles',

  initialize: function() {

    // Dialog state model
    this.model = new cdb.core.Model({
      polygonsEnabled: true,
      pointsEnabled: true,
      geometry_type: "points"
    });

    this.model.bind('change:polygonsEnabled', this._onPolygonsEnabledChange, this);
    this.model.bind('change:pointsEnabled',   this._onPointsEnabledChange, this);
    this.model.bind('change:geometry_type',   this._onGeometryTypeChange, this);

  },

  _onLearnMoreClick: function(e) {

    e.preventDefault();
    e.stopPropagation();

  },

  _onGeometryTypeChange: function() {

    var geometry_type = this.model.get("geometry_type");

    this.$el.find("li").removeClass("selected");
    this.$el.find("li." + geometry_type).addClass("selected");

    this.trigger("geometryTypeChanged", geometry_type);

  },

  _onPointsEnabledChange: function() {

    if (this.model.get("pointsEnabled")) {
      this.$(".points").removeClass("disabled");
      this.$(".points span").html(this._TEXTS.points.enabled);
    } else {
      this.$(".points").addClass("disabled");
      this.$(".points span").html(this._TEXTS.points.disabled);
    }

  },
  _onPolygonsEnabledChange: function() {

    if (this.model.get("polygonsEnabled")) {
      this.$(".polygons").removeClass("disabled");
      this.$(".polygons span").html(this._TEXTS.polygons.enabled);
    } else {
      this.$(".polygons").addClass("disabled");
      this.$(".polygons span").html(this._TEXTS.polygons.disabled);
    }

  },

  _onGeometryTypeClick: function(e) {

    e.preventDefault();
    e.stopPropagation();

    var $option       = $(e.target).closest("a");
    var geometry_type = $option.attr("data-style");

    if (!this.model.get(geometry_type + "Enabled")) return;

    this.model.set("geometry_type", geometry_type);

  },

  render: function() {

    this.template_base = cdb.templates.getTemplate(this.template_name);
    this.$el.append(this.template_base(_.extend(this.model.toJSON(), this.options)));

    return this;
  }

});

cdb.admin.GeoreferenceDialog = cdb.admin.BaseDialog.extend({

  _TEXTS: {
    title:       _t('Georeference your data'),
    next_button: _t('Georeference'),
    back_button: _t("Go back"),
    continue:    _t("Continue"),
    cancel:      _t("Cancel"),
    errors: {
      default: 'Sorry, something went wrong and we\'re not sure what. Contact us \
                at <a href="mailto:contac@cartodb.com">contact@cartodb.com</a>.'
    }
  },

  FILTERED_COLUMNS: [
    'cartodb_id',
    'created_at',
    'updated_at',
    'the_geom',
    'the_geom_webmercator',
    'cartodb_georef_status'
  ],

  // do not remove
  events: cdb.core.View.extendEvents({
    'click li > a.option': '_onOptionClicked',
    "click .next": "_onNextClick",
    "click .back": "_onBackClick",
  }),

  initialize: function() {

    _.bindAll(this, "_onCountrySelected", "_onColumnSelected", "_onAdmSelected", "_onChangeCountry", "_onAdmGetSuccess", "_onChangeEnableNext", "_onChangeEnableBack", "_onChangeBackButtonText", "_loadState", "_onNextClick", "_onBackClick");

    // dialog options
    _.extend(this.options, {
      title: this._TEXTS.title,
      template_name:  'table/header/views/georeference_dialog_base',
      clean_on_hide: true,
      ok_button_classes: "button disabled grey",
      ok_title: this._TEXTS.next_button,
      modal_class: 'georeference_dialog',
      width: 572
    });

    //var dlg = new cdb.admin.GeocoderMessageDialog({
      //style: "polygon",
      //title: "2,300 rows of 2,512 were georeferenced",
      //description: "Looks like not all fields were georeferenced correctly. It may be a problem with the identificator you have in your selected column. Review it and georeference again if you feel that it’s necesary.",
    //});

    //dlg.appendToBody().open();
    //dlg.animate();

    //this.options.geocoder.bind("geocodingError", function() {
      //alert('error');
    //}, this);

    //this.options.geocoder.bind("geocodingStarted", function() {
      //alert('started');
    //}, this);

    //this.options.geocoder.bind("geocodingComplete", function() {
      //alert('complete');
    //}, this);

    this.table = this.options.table;
    this.user  = this.options.user;

    var columns = this._getColumns();

    this.model = new cdb.core.Model({
      option:      0,
      enableNext:  false,
      enableBack:  true,
      state:       0,
      column:      columns[0],
      country:     "world",
      adm:         "countries",
      columnNames: columns,
      available_geometries: ["polygons"]
    });

    // Model bindings
    this.model.bind('change:option',         this._onOptionChange,         this);
    this.model.bind("change:enableNext",     this._onChangeEnableNext,     this);
    this.model.bind("change:enableBack",     this._onChangeEnableBack,     this);
    this.model.bind("change:nextButtonText", this._onChangeNextButtonText, this);
    this.model.bind("change:backButtonText", this._onChangeBackButtonText, this);

    this.model.bind("change:country", this._onChangeCountry, this);
    this.model.bind("change:adm",     this._onChangeAdm,     this);

    // Continue with the constructor initialize
    this.constructor.__super__.initialize.apply(this);

    $.extend($.easing, {
      easeInQuad: function (x, t, b, c, d) {
        return c*(t/=d)*t + b;
      },
      easeOutQuad: function (x, t, b, c, d) {
        return -c *(t/=d)*(t-2) + b;
      },
      easeInOutQuad: function (x, t, b, c, d) {
        if ((t/=d/2) < 1) return c/2*t*t + b;
        return -c/2 * ((--t)*(t-2) - 1) + b;
      }
    });

  },

  _getColumns: function() {

    var self   = this;
    var schema = this.table.get("schema");

    var columns = _.compact(_.map(schema, function(column, key) {
      if (!_.contains(self.FILTERED_COLUMNS, column[0])) {
        return { name: column[0], columnType: column[1] }
      }
    }));

    return _.pluck(columns, 'name');

  },

  _showMessage: function() {

    this.$("section").addClass("notification");
  },

  /*
   *  Called when the user clicks in the $next button
   */
  _onNextClick: function(e) {

    this.killEvent(e);
    var state  = this.model.get("state");
    var option = this.model.get("option");

    //console.log("state = " + state, "option = " + option, this.model.get("enableNext"));

    if (!this.model.get("enableNext")) return;

    if (option == 2) {
      this.model.set({
        previous_state: state,
        state: state + 1,
        enableNext: true
      });
    }

    this._loadState();

  },

  /*
   *  Called when the user clicks in the $back button
   */
  _onBackClick: function(e) {

    this.killEvent(e);
    var state = this.model.get("state");

    if (!this.model.get("enableBack")) return;

    if (state == 0 || this.model.get("option") != 2) {
      this.hide();
      return;
    }

    var stepName = "georeference_" + state;

    this.model.set({
      previous_state: this.model.get("state"),
      state:          this.model.get("state") - 1,
      nextButtonText: this._TEXTS.next_button,
      enableBack:     false
    });

    this._loadState();

  },

  _onChangeNextButtonText: function() {

    this.$next.text(this.model.get("nextButtonText"));

  },

  _onChangeBackButtonText: function() {

    this.$back.text(this.model.get("backButtonText"));

  },

  _onChangeEnableNext: function() {

    if (this.model.get("enableNext")) {
      this.$next.removeClass("disabled");
    } else {
      this.$next.addClass("disabled");
    }

  },

  _onChangeEnableBack: function() {

    if (this.model.get("enableBack")) {
      $(this).removeClass("hidden");
    } else {
      $(this).addClass("hidden");
    }

  },

  _loadState: function() {

    var
    self             = this,
    enableNext       = false,
    state            = this.model.get("state"),
    previousState    = this.model.get("previous_state"),
    option           = this.model.get("option");

    var stepName = "georeference_" + state;

    this.$el.removeClass("step_" + previousState);
    this.$el.addClass("step_" + state);

    if (previousState < state && previousState > 0) enableNext = true;

    if (state == 0 && option != 2) {

      this._geoReference();
      return;

    }

    if (state == 0) {

      this._showInitialStep();
      return;

    }

    if (state == 1) {

      this._showChooseGeometryTypeStep();
      return

    }

    if (state == 2) {

      this._geoReference();
      return;

    }

  },

  _showInitialStep: function() {

    var self = this;

    this.model.set({
      state:          0,
      previousState:  0,
      enableBack:     true,
      enableNext:     true,
      geometry_type:  "points",
      backButtonText: this._TEXTS.cancel
    });

    this.$el.find(".inner").animate({ height: this.model.get("originalHeight"), left: 0 }, { easing: "easeOutQuad", duration: 200, complete: function() {
      self.$el.find(".inner").css({ height: "auto" });
      self.$el.find(".points").removeClass("animated");
    }});

    setTimeout(function() {
      //self._center();
    }, 400);

  },

  _showChooseGeometryTypeStep: function() {

    var self = this;

    this.model.set({
      enableBack:             true,
      enableNext:             true,
      backButtonText:         this._TEXTS.back_button,
      nextButtonText:         this._TEXTS.continue
    });

    var available_geometries = this.model.get("available_geometries");

    var polygonsEnabled = _.contains(available_geometries, "polygon");
    var pointsEnabled   = _.contains(available_geometries, "point");

    this.styles.model.set("polygonsEnabled", polygonsEnabled);
    this.styles.model.set("pointsEnabled",  pointsEnabled);

    if (polygonsEnabled && !pointsEnabled) this.styles.model.set("geometry_type", "polygons");
    else if (!polygonsEnabled && pointsEnabled) this.styles.model.set("geometry_type", "points");
    else this.styles.model.set("geometry_type", "points");

    //this.$el.find(".options").slideUp(100, function() {
      //self.$el.find(".georeference_styles").slideDown(200);
    //});

    this.model.set("originalHeight", this.$el.find(".inner").height());

    this.$el.find(".inner").animate({ height: 178, left: -550 }, { easing: "easeOutQuad", duration: 200 });

    //this._center();

    setTimeout(function() {
      self.$el.find(".points").addClass("animated");
    }, 600);


  },

  _center: function() {
    this.centerInScreen(true);
  },

  /*
   * Centers the .modal dialog in the middle of the screen.
   *
   * You can pass { animation: true } to center the current dialog in the screen
   * with animation or not
   */
  centerInScreen: function(animation, speed_) {

    var speed = speed_ || 220;

    var $modal = this.$('.modal')
    , modal_height = $modal.height()

    if (modal_height > 0) {
      $modal.animate({
        marginTop: -(modal_height/2)
      }, (animation) ? speed : 0)
    }
  },

  /////////////
  // Renders //
  /////////////

  render: function() {
    cdb.admin.BaseDialog.prototype.render.call(this);
    // Set option if it was defined
    return this;
  },

  render_content: function() {
    this.hasContent = this.table._data.length > 0;

    var $content = this.$content = $("<div class='inner' />");

    this.styles = new cdb.admin.GeoreferenceStyles({ });
    this.styles.bind("geometryTypeChanged", this._onGeometryTypeChanged, this);

    this._getCountryList();

    var temp_content = this.getTemplate('table/header/views/georeference_dialog');

    $(".help")
    .tipsy({
      gravity: 's',
      live: true,
      fade: true,
      html: true,
      offset: -2,
      title: function() {
        return $(this).attr("data-tipsy")
      }
    });

    this.$next = this.$(".next");
    this.$back = this.$(".back");

    $content.append(temp_content(_.extend(this.model.toJSON(), { hasContent: this.hasContent })));
    $content.append(this.styles.render().$el);

    this.$el.addClass("option_0");

    this._setupCombos();

    if (this.hasContent) {

      this.model.set("enableNext", true);
      this._fillColumnNames($content);
      this._autocomplete($content);
      this._renderStats();

      if (this.options.georeference_column) {
        $content.find('.address input').val("{" + this.options.georeference_column + "}");
      }

      this.$('a.next').removeClass('disabled').removeAttr('disabled', 'disabled');

    } else {

      this.$('a.next').addClass('disabled').attr('disabled', 'disabled');

    }

    return $content;

  },

  _onGeometryTypeChanged: function(geometry_type) {

    this.model.set("geometry_type", geometry_type);

  },

  _renderStats: function() {
    this.geocoder_stats = new cdb.admin.GeocoderStats({ model: this.user, table: this.table });
    this.$('div.content').after(this.geocoder_stats.render().el);
    this.addView(this.geocoder_stats);
  },

  _setupCombos: function() {

    this.$content.find("select").select2({
      minimumResultsForSearch: 20
    });

    this.$content.find("select#adm").bind("change", this._onAdmSelected);
    this.$content.find("select#column").bind("change", this._onColumnSelected);
    this.$content.find("select#countries").bind("change", this._onCountrySelected);

  },

  _refreshSelect: function(id, options) {

    $("#" + id).select2("destroy").html(options).select2({
      minimumResultsForSearch: 20
    });

  },

  _getCountryList: function() {

    var self = this;

    var country_code = this.model.get("country");
    var url = "/api/v1/geocodings/get_countries/";

    $.ajax({
      url: url,
      dataType:'json',
      success: function(res) {
        console.log(res);

        var options = [];

        options.push('<option value="world">World</option>');
        _.each(res, function(option) {
          options.push('<option value="' + option.iso3 + '">' + option.name + '</option>');
        });

        self._refreshSelect("countries", options.join());
        //self.model.set("countries", self.$content.find("select#countries").val());

      },
      error: function(res) {
        console.log(res);
      }});
  },

  _updateAdmSelect: function() {

    var self = this;

    var country_code = this.model.get("country");
    var url = "/api/v1/geocodings/country_data_for/" + country_code;

    $.ajax({
      url: url,
      dataType:'json',
      success: this._onAdmGetSuccess,
      error: function(res) {
        console.log(res);
      }});
  },

  _onAdmGetSuccess: function(res) {

    var options = [];

    //debugger;
    console.log(res); // TODO: remove

    if (res.admin0[0] || res.admin0[1]) {
      options.push('<option value="admin0">admin0</option>');
      this.model.set("admin0", res.admin0);
    }

    if (res.admin1[0] || res.admin1[1]) {
      options.push('<option value="admin1">admin1</option>');
      this.model.set("admin1", res.admin1);
    }

    if (res.postalcode[0] || res.postalcode[1]) {
      options.push('<option value="postalcode">Postal Code</option>');
      this.model.set("postalcode", res.postalcode);
    }

    if (res.namedplace[0] || res.namedplace[1]) {
      options.push('<option value="namedplace">Named places</option>');
      this.model.set("namedplace", res.namedplace);
    }

    this._refreshSelect("adm", options.join());
    this.model.set("adm", this.$content.find("select#adm").val());

    console.log(this.$content.find("select#adm").val())

  },

  _onAdmSelected: function() {

    var adm = this.$content.find("select#adm").val();

    this.model.set("adm", adm);

  },

  _onChangeAdm: function() {

    var adm = this.model.get("adm");

    this.model.set("available_geometries", this.model.get(adm));

  },

  _onColumnSelected: function() {

    this.model.set("column", this.$content.find("select#columns").val());

  },

  _onCountrySelected: function() {

    this.model.set("country", this.$content.find("select#countries").val());

  },

  _onChangeCountry: function() {

    var country = this.model.get("country");

    if (country === "world") {

      this._refreshSelect("adm", '<option value="countries">countries</option>');
      this.model.set("available_geometries", ["polygons"]);

    } else {

      this._updateAdmSelect();

    }

  },


  _fillColumnNames: function(el) {
    var columns = this.table.nonReservedColumnNames()
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
    var columns = this.table.nonReservedColumnNames()
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

        // If autocomplete menu is not active and user keys ENTER, go ahead!
        if ( ev.keyCode === $.ui.keyCode.ENTER && !$( this ).data( "autocomplete" ).menu.active ) {
          ev.preventDefault();
          self._ok();
          return false;
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


  /////////////////////////
  // Action over options //
  /////////////////////////

  _onOptionClicked: function(e) {
    e.preventDefault();

    var $li = $(e.target).closest('li');
    var option = $li.data('option') || $li.index() || 0;

    this.model.set('option', option);

  },

  _onOptionChange: function() {
    this._setDialogOption();
    this._setOkButton();
    this._setUserStats();

    this.$el.removeClass("option_" + this.model.previous("option"));
    this.$el.addClass("option_" + this.model.get("option"));

  },

  _setDialogOption: function() {
    var option = this.model.get('option');
    var $ul = this.$('ul.options');
    var $li = $ul.find('> li[data-option="' + option + '"]') || $ul.find('> li:eq(' + option + ')');

    $ul.find('> li .cont').slideUp(100);
    $ul.find('> li')
      .removeClass('active')
      .find('> a.option').removeClass('selected');

    $li.find(".cont").slideDown(100);
    $li
      .addClass('active')
      .find('> a.option').addClass('selected');

    if (option == 1) {
      this.$('input.column_autocomplete').focus();
    }

    var self = this;

    setTimeout( function() {
      //self._center();
    }, 400);

  },

  _setOkButton: function() {

    var option = this.model.get('option');
    var $a = this.$('a.next');
    var state = 'removeClass';

    // State
    if ((option == 1 && !this.canGeocode()) || !this.hasContent) {
      state = 'addClass';
    }

    $a[state]('disabled');
  },

  _setUserStats: function() {
    var option = this.model.get('option');
    this.geocoder_stats && this.geocoder_stats[option == 1 ? 'show' : 'hide' ]();
  },


  ///////////////////////
  // Show / Hide error //
  ///////////////////////

  _hideError: function() {
    this.$(".address div.info").removeClass("active")
  },

  _showError: function() {
    this.$(".address div.info").addClass("error active")
  },


  //////////////////////
  // Dialog functions //
  //////////////////////

  _ok: function(ev) { },

  _geoCodeZip: function(column_name, country_code, geometry_type) {

    this.options.geocoder.set({
      kind:         'postalcode',
      column_name:   column_name,
      country_code:  country_code,
      geometry_type: geometry_type
    });

    // TODO: add mixpanel

    this.hide();

  },

  _geoCodeLatAndLng: function() {

    this.table.geocodeLatAndLng(this.latitude, this.longitude);

    // Mixpanel event
    cdb.god.trigger('mixpanel', 'Geocoding', {
      type: 'point-coordinates',
      latitude: this.latitude,
      longitude: this.longitude,
      table_name: this.table.get('id')
    });

    this.hide();

  },

  _geoCodeAddress: function() {

    var $input = this.$('.address input.column_autocomplete');
    var  address = $input.val().replace(/^\s+|\s+$/g, "");

    // Check if user can geocode
    if (!this.canGeocode()) {
      return false;
    }

    // Check address
    if (this._checkAddressInput(address)) {

      this._hideError();
      this.options.geocoder.set('formatter', address);

      // Mixpanel event
      cdb.god.trigger('mixpanel', 'Geocoding', {
        type: 'point-address',
        address: address,
        table_name: this.table.get('id')
      });

      this.hide();

    } else {
      this._showError();
      return false;
    }

  },

  _geoReference: function(ev) {

    this.killEvent(ev);

    if (this.hasContent) {

      var option = parseInt(this.model.get('option'));

      switch (option) {
        case 0:
          this._geoCodeLatAndLng();
        break;
        case 1:
          this._geoCodeAddress();
        break;
        case 2:
          var adm = this.model.get("adm");
          console.log(adm)
          if (adm == "postalcode") this._geoCodeZip(this.model.get("column"), this.model.get("country"), this.model.get("geometry_type"));
        break;
      }

    }

  },

  ///////////////////////
  // Control functions //
  ///////////////////////

  // Control function to know if user can geocode or not
  canGeocode: function() {
    var geocoding = this.user.get('geocoding');
    return !(((( geocoding.monthly_use || 0) * 100) / ( geocoding.quota || 0 )) >= 100 && geocoding.hard_limit)
  },

  // Function to check address input
  _checkAddressInput: function(address) {
    if (address && address.length > 1) {
      return true;
    } else {
      return false;
    }
  },


  //////////////////////////
  // Prototype functions //
  //////////////////////////

  clean: function() {
    var $column_autocomplete = this.$("input.column_autocomplete");

    $column_autocomplete
      .unbind("keydown")
      .autocomplete("destroy");

    cdb.admin.BaseDialog.prototype.clean.call(this);
  }
});
