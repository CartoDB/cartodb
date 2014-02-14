
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

  // do not remove
  events: cdb.core.View.extendEvents({
    'click li > a.option': '_onOptionClicked',
    "click .next": "_onNextClick",
    "click .back": "_onBackClick",
    "click .georeference_styles a": "_onStyleClick"
  }),

  initialize: function() {

    _.bindAll(this, "_onChangeEnableNext", "_onChangeEnableBack", "_onChangeBackButtonText", "_loadState", "_onNextClick", "_onBackClick", "_onStyleClick");

    // dialog options
    _.extend(this.options, {
      title: this._TEXTS.title,
      template_name:  'table/header/views/georeference_dialog_base',
      clean_on_hide: true,
      ok_button_classes: "button disabled grey",
      ok_title: this._TEXTS.next_button,
      //modal_type:  '',
      modal_class: 'georeference_dialog',
      width: 572
    });

    this.table = this.options.table;
    this.user  = this.options.user;

    // Dialog state model
    this.model = new cdb.core.Model({
      option: '',
      enableNext:            false,
      enableBack:            true,
      state:                 0
    });

    // Model bindings
    this.model.bind('change',                this._onOptionChange,         this);
    this.model.bind("change:enableNext",     this._onChangeEnableNext,     this);
    this.model.bind("change:enableBack",     this._onChangeEnableBack,     this);
    this.model.bind("change:nextButtonText", this._onChangeNextButtonText, this);
    this.model.bind("change:backButtonText", this._onChangeBackButtonText, this);
    this.model.bind("change:style",          this._onChangeStyle,          this);

    // Continue with the constructor initialize
    this.constructor.__super__.initialize.apply(this);

  },

  /*
   *  Called when the user clicks in the $next button
   */
  _onNextClick: function(e) {

    this.killEvent(e);
    var state  = this.model.get("state");
    var option = this.model.get("option");
    console.log("state = " + state, "option = " + option, this.model.get("enableNext"));

    if (!this.model.get("enableNext")) return;

    if (state == 0 && option == 2) {
      this.model.set({
        previous_state: state,
        state: state + 1,
        enableNext: true
      });
    }

    this._loadState();

  },

  _onStyleClick: function(e) {

    e.preventDefault();
    e.stopPropagation();

    var $option = $(e.target).closest("a");
    var style   = $option.attr("data-style");
    console.log(style);

    this.model.set("style", style);

  },

  /*
   *  Called when the user clicks in the $back button
   */
  _onBackClick: function(e) {

    this.killEvent(e);
    var state = this.model.get("state");

    if (!this.model.get("enableBack")) return;

    if (state == 0) {
      this.hide();
      return;
    }

    if (this.model.get("option") != 2) {
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

  _onChangeStyle: function() {

    var style = this.model.get("style");

    this.$(".georeference_styles li").removeClass("selected");
    this.$(".georeference_styles li." + style).addClass("selected");

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

      //this.$back.fadeIn(150, function() {
        $(this).removeClass("hidden");
      //});

    } else {

      //this.$back.fadeOut(150, function() {
        $(this).addClass("hidden");
      //});

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
    console.log("state = " + state, "option = " + option);

    if (previousState < state && previousState > 0) enableNext = true;

    if (state == 0 && option != 2) {
      this._geoReference();
      return;
    }

    if (previousState == 1 && state == 0) {

      this.model.set({
        state:                  0,
        previousState:          0,
        enableBack:             true,
        enableNext:             true,
        style:                  "points",
        backButtonText:         this._TEXTS.cancel
      });

      this.$el.find(".points").removeClass("animated");
      this.$el.find(".options").slideDown(100);
      this.$el.find(".georeference_styles").slideUp(100);
      this._center();

      return;
    }

    if (state == 1) {

      this.model.set({
        enableBack:             true,
        enableNext:             false,
        backButtonText:         this._TEXTS.back_button,
        nextButtonText:         this._TEXTS.continue
      });

      this.$el.find(".options").slideUp(100);
      this.$el.find(".georeference_styles").slideDown(100);
      this._center();

      setTimeout(function() {
        self.$el.find(".points").addClass("animated");
      }, 600);

      return;
    }

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
  centerInScreen: function(animation) {
    var $modal = this.$('.modal')
    , modal_height = $modal.height()

    if (modal_height > 0) {
      $modal.animate({
        marginTop: -(modal_height/2)
      }, (animation) ? 220 : 0)
    }
  },

  /////////////
  // Renders //
  /////////////

  render: function() {
    cdb.admin.BaseDialog.prototype.render.call(this);
    // Set option if it was defined
    this.model.set('option', this.options.option || 0);
    return this;
  },

  render_content: function() {
    this.hasContent = this.table._data.length > 0;

    var $content = this.$content = $("<div>");
    var temp_content = this.getTemplate('table/header/views/georeference_dialog');

    this.$next = this.$(".next");
    this.$back = this.$(".back");

    $content.append(temp_content({hasContent:this.hasContent}));

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

  _renderStats: function() {
    this.geocoder_stats = new cdb.admin.GeocoderStats({ model: this.user, table: this.table });
    this.$('div.content').after(this.geocoder_stats.render().el);
    this.addView(this.geocoder_stats);
  },

  _setupCombos: function() {

    this.$content.find("#countries").select2();

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
  },

  _setDialogOption: function() {
    var option = this.model.get('option');
    var $ul = this.$('ul.options');
    var $li = $ul.find('> li[data-option="' + option + '"]') || $ul.find('> li:eq(' + option + ')');

    $ul.find('> li')
      .removeClass('active')
      .find('> a.option').removeClass('selected');
    $li
      .addClass('active')
      .find('> a.option').addClass('selected');

    if (option == 1) {
      this.$('input.column_autocomplete').focus();
    }

    var self = this;

    setTimeout( function() {
      self._center();
    }, 100);

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

  _geoCodeWithLatAndLng: function() {
    this.table.geocode_using(this.latitude, this.longitude);

    // Mixpanel event
    cdb.god.trigger('mixpanel', 'Geocoding', {
      type: 'point-coordinates',
      latitude: this.latitude,
      longitude: this.longitude,
      table_name: this.table.get('id')
    });

    this.hide();

  },

  _geoCodeWithAddress: function() {

    var $input = this.$('.address input.column_autocomplete')
      , address = $input.val().replace(/^\s+|\s+$/g, "");

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

      var option = this.model.get('option');

      // dont not change by ===
      if (option == 0) {
        this._geoCodeWithLatAndLng();
      } else if (this.model.get('option') == 1) {
        this._geoCodeWithAddress();
      }

    }

    //this.hide();

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
