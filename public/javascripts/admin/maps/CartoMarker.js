  function CartoMarker(latlng, cartodb_id, map) {
    this.latlng_ = latlng;
    this.map_ = map;
    this.offsetVertical_ = -33;
    this.offsetHorizontal_ = -12;
    this.height_ = 33;
    this.width_ = 33;
    this.cartodb_id = cartodb_id;
    this.setMap(map);
  }

  CartoMarker.prototype = new google.maps.OverlayView();

  CartoMarker.prototype.draw = function() {
    var me = this;

    var div = this.div_;
    if (!div) {
      div = this.div_ = document.createElement('canvas');
      div.style.border = "none";
      div.style.position = "absolute";
      div.style.width = '33px';
      div.style.height = '33px';
      div.style.background = 'url("/images/admin/map/marker.png") no-repeat 0 0';
      var panes = this.getPanes();
      panes.floatPane.appendChild(div);

      $(div).draggable({stop:  function(event,ui) {
          me.latlng_ = me.getProjection().fromDivPixelToLatLng(new google.maps.Point(ui.position.left-me.offsetHorizontal_,ui.position.top-me.offsetVertical_));
          onMoveOccurrence(me.latlng_,me.cartodb_id, me);
      },start: function(event,ui) {
          me.init_latlng = me.getProjection().fromDivPixelToLatLng(new google.maps.Point(ui.position.left-me.offsetHorizontal_,ui.position.top-me.offsetVertical_));
      }});
    }

    var pixPosition = me.getProjection().fromLatLngToDivPixel(me.latlng_);
    if (pixPosition) {
      div.style.width = me.width_ + 'px';
      div.style.left = (pixPosition.x + me.offsetHorizontal_) + 'px';
      div.style.height = me.height_ + 'px';
      div.style.top = (pixPosition.y + me.offsetVertical_) + 'px';
    }

  };

  CartoMarker.prototype.remove = function() {
    if (this.div_) {
      this.div_.parentNode.removeChild(this.div_);
      this.div_ = null;
      this.setMap(null);
    }
  };

  CartoMarker.prototype.hide = function() {
    if (this.div_) {
      $(this.div_).find('div').fadeOut();
    }
  };

  CartoMarker.prototype.getPosition = function() {
   return this.latlng_;
  };