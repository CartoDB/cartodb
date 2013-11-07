
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
    title:      _t('Georeference your table'),
    ok_button:  _t('Georeference')
  },

  // do not remove
  events: cdb.core.View.extendEvents({
    'click li > a.option': '_onOptionClicked'
  }),

  initialize: function() {
    // dialog options
    _.extend(this.options, {
      title: this._TEXTS.title,
      template_name: 'common/views/dialog_base',
      clean_on_hide: true,
      ok_button_classes: "button grey disabled",
      ok_title: this._TEXTS.ok_button,
      modal_type: "",
      modal_class: 'georeference_dialog',
      width: 572
    });

    this.table = this.options.table;
    this.user = this.options.user;

    // Dialog state model
    this.model = new cdb.core.Model({ option: '' });
    this.model.bind('change', this._onOptionChange, this);

    // Continue with the constructor initialize
    this.constructor.__super__.initialize.apply(this);
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
    $content.append(temp_content({hasContent:this.hasContent}));
    
    if (this.hasContent) {
      this._fillColumnNames($content);
      this._autocomplete($content);
      this._renderStats();

      if(this.options.georeference_column) {
        $content.find('.address input').val("{" + this.options.georeference_column + "}");
      }
      this.$('a.ok').removeClass('disabled').removeAttr('disabled', 'disabled');
    } else {
      this.$('a.ok').addClass('disabled').attr('disabled', 'disabled');
    }
    return $content;
  },

  _renderStats: function() {
    this.geocoder_stats = new cdb.admin.GeocoderStats({ model: this.user, table: this.table });
    this.$('div.content').after(this.geocoder_stats.render().el);
    this.addView(this.geocoder_stats);
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
  },

  _setOkButton: function() {
    var option = this.model.get('option');
    var $a = this.$('a.ok');
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

  open: function(options) {
    var self = this;

    this.trigger("will_open", this);

    this.$(".modal").css({
      "opacity": "0",
      "marginTop": "170px"
    });

    this.$(".mamufas").fadeIn();

    this.$(".modal").animate({
      marginTop: 80,
      opacity: 1
    }, 300);
  },

  _ok: function(ev) {
    this.killEvent(ev);

    if (this.hasContent) {

      if (this.model.get('option') == 0) { // dont not change by ===
        this.table.geocode_using(this.latitude, this.longitude);
        // Mixpanel event
        cdb.god.trigger('mixpanel', 'Geocoding', {
          type: 'point-coordinates',
          latitude: this.latitude,
          longitude: this.longitude,
          table_name: this.table.get('id')
        });
      } else if (this.model.get('option') == 1) { // geocoding using address
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
        } else {
          this._showError();
          return false;
        }
      }
    }

    this.hide();
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
