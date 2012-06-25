  function CartoTooltip(latlng, map) { this.latlng_ = latlng; this.markers_; this.offsetVertical_ = -20; this.offsetHorizontal_ = 0; this.height_ = 22; this.setMap(map);}

  CartoTooltip.prototype = new google.maps.OverlayView();

  CartoTooltip.prototype.draw = function() {
      var me = this;
      var div = this.div_;

      if (!div) {
          div = this.div_ = document.createElement('DIV');
          div.setAttribute('class','marker_tooltip');

          $(div).append('<span><p>1 point</p><a class="info" href="#show_info">i</a><a class="margin edit" href="#edit">e</a><a class="margin delete_geometry" href="#delete_geometry">x</a></span>');

          $(div).find('a.info').click(function(ev){
              ev.preventDefault();
							ev.stopPropagation();
              me.hide();
              window.map.carto_map.over_marker_ = true;
              window.map.carto_map.info_window_.open(me.markers_,null,me.latlng_);
          });

          $(div).find('a.edit').click(function(ev){
              ev.preventDefault();
							ev.stopPropagation();
              me.hide();
              window.map.carto_map.createFakeGeometry(me.markers_);
          });

          $(div).hover(
            function(){
              window.map.carto_map.over_tooltip = true;
            },
	          function(){
							window.map.carto_map.over_tooltip = false;
	            setTimeout(function(){
	            	if (!window.map.carto_map.over_marker) {
									$('div#map').unbind('mousemove');
									clearInterval(window.map.carto_map.interval);
									me.hide();
								}
	            },100);
	          }
          );

          var panes = this.getPanes();
          panes.floatPane.appendChild(div);
          $(div).css({opacity:0});
      }

      // Position the overlay
      var pixPosition = this.getProjection().fromLatLngToDivPixel(this.latlng_);
      if (pixPosition) {
          div.style.left = (pixPosition.x + this.offsetHorizontal_) + "px";
          div.style.height = this.height_ + "px";
          div.style.top = (pixPosition.y + this.offsetVertical_) + "px";
      }
  };

  CartoTooltip.prototype.remove = function() {
      if (this.div_) {
          this.div_.parentNode.removeChild(this.div_);
          this.div_ = null;
      }
  };

  CartoTooltip.prototype.open = function(latlng,marker) {
      if (this.div_) {
        var div = this.div_;
        var me = this;
        
        // App status
        var is_query = $('body').attr('query_mode') === 'true';
        
        if (!is_query) {
          div.style.width = '48px';
					$(div).find('a.edit').show();
					$(div).find('a.delete_geometry').show();
          $(div).find('a.info').show();
          $(div).find('p').hide();
          $(div).find('a.delete_geometry').unbind('click');
          $(div).find('a.delete_geometry').click(function(ev){
            ev.preventDefault();
						ev.stopPropagation();
            window.map.carto_map.over_marker_ = true;
            me.hide();
            window.map.carto_map.delete_window_.open(me.latlng_,marker,me.pixel);
          });
        } else {
          div.style.width = '14px';
          $(div).find('a.info').show();
          $(div).find('a.delete_geometry').hide();
          $(div).find('a.edit').hide();
          $(div).find('p').hide();
        }

        this.markers_ = marker;
        this.latlng_ = latlng;
        var pixPosition = this.getProjection().fromLatLngToDivPixel(latlng);
        if (pixPosition) {
          div.style.left = (pixPosition.x + this.offsetHorizontal_) + "px";
          div.style.top = (pixPosition.y + this.offsetVertical_ - 7) + "px";
        }
        this.show();
      }
  }

  CartoTooltip.prototype.hide = function() {
      if (this.div_) {
          var div = this.div_;
          div.style.visibility = "hidden";
      }
  }

  CartoTooltip.prototype.show = function() {
      if (this.div_) {
          var div = this.div_;
          div.style.visibility = "visible";
          div.style.opacity = 1;
      }
  }

	CartoTooltip.prototype.setPosition = function(latlng,feature) {
		if (this.div_ && !window.map.carto_map.over_tooltip) {
      var div = this.div_;
      var me = this;
			
    	this.latlng_ = latlng;
	    var pixPosition = this.getProjection().fromLatLngToDivPixel(latlng);
	    if (pixPosition) {
				if (this.markers_ == feature) {
					$(div).animate({left:(pixPosition.x + this.offsetHorizontal_ + 4) + "px",top:(pixPosition.y + this.offsetVertical_ - 7) - 208 + "px"},{queue:false,duration:150});
				} else {
					this.markers_ = feature;
					div.style.left = (pixPosition.x + this.offsetHorizontal_) + "px";
		      div.style.top = (pixPosition.y + this.offsetVertical_ - 7) - 208 + "px";
				}
	    }
    	this.show();
		}
	}

  CartoTooltip.prototype.isVisible = function() {
      if (this.div_) {
          var div = this.div_;

          if ($(div).css('visibility')=='visible') {
              return true;
          } else {
              return false;
          }
      }
  }