

	function CartoInfowindow(latlng, info, map) {
	  this.latlng_ = latlng;
		this.info_ = info;
		this.map_ = map;
	
	  this.offsetHorizontal_ = -116;
	  this.width_ = 233;
	
	  this.setMap(map);
	}


	CartoInfowindow.prototype = new google.maps.OverlayView();


	CartoInfowindow.prototype.draw = function() {
					
	  var me = this;
		var num = 0;
		

	  var div = this.div_;
	  if (!div) {
	    div = this.div_ = document.createElement('div');
	    div.setAttribute('class','marker_infowindow');
	
			$(div).append('<a href="#close">close</a>'+
			              '<div class="top">'+
			              '</div>'+
			              '<span class="arrow">'+
		                '</span>');

      google.maps.event.addDomListener(div,'click',function(ev){ 
        try{
          ev.stopPropagation();
        }catch(e){
          event.cancelBubble=true;
        };
      });

      google.maps.event.addDomListener(div,'dblclick',function(ev){ 
        try{
          ev.stopPropagation();
        }catch(e){
          event.cancelBubble=true;
        };
      });
			
	    var panes = this.getPanes();
	    panes.floatPane.appendChild(div);
	
			this.moveMaptoOpen();
	  }
		this.setPosition();
	};
	
	
	CartoInfowindow.prototype.setPosition = function() {
	  
	  if (this.div_) { 
  	  var div = this.div_;
  	  var pixPosition = this.getProjection().fromLatLngToDivPixel(this.latlng_);
  	  if (pixPosition) {
  		  div.style.width = this.width_ + 'px';
  		  div.style.left = (pixPosition.x + this.offsetHorizontal_) + 'px';
  		  var actual_height = - $(div).height();
  		  div.style.top = (pixPosition.y + actual_height - (($(div).css('opacity') == 1)? 10 : 0)) + 'px';
  	  }
  	  this.show();
    }
	}
	
	
	CartoInfowindow.prototype.open = function(marker_id){
	  
	  console.log(carto_map.points_[1]);
	  
	  if (this.div_) {
	    var div = this.div_;
	    this.latlng_ = new google.maps.LatLng(carto_map.points_[marker_id].lat_,carto_map.points_[marker_id].lon_);
	    $(div).find('div.top').html('');
	    
	    var marker_data = carto_map.points_[marker_id];
	    
	    _.each(marker_data,function(value,label){
	      if (label != 'created_at' && label != 'updated_at' && label != 'the_geom' && label != 'the_geom_webmercator') {
	        $(div).find('div.top').append('<label>'+label+'</label><input type="text" readonly="true" value="'+value+'" />');
	      }
	    });
	    
	    this.moveMaptoOpen();
	    
	    this.setPosition();			
	  }
	}


	CartoInfowindow.prototype.hide = function() {
	  if (this.div_) {
	    var div = this.div_;
	    $(div).stop().animate({
	      top: '+=' + 10 + 'px',
	      opacity: 0
	    }, 100, 'swing', function(ev){
				div.style.visibility = "hidden";
			});
	  }
	}


	CartoInfowindow.prototype.show = function() {
	  if (this.div_) {
	    var div = this.div_;
			$(div).css({opacity:0});
			div.style.visibility = "visible";

	    $(div).stop().animate({
	      top: '-=' + 10 + 'px',
	      opacity: 1
	    }, 250, 'swing');
			
		}
	}


	CartoInfowindow.prototype.isVisible = function() {
	  if (this.div_) {
	    var div = this.div_;
			if ($(div).css('visibility')=='visible') {
				return true;
			} else {
				return false;
			}
		} else {
			return false;
		}
	}
	
	
	CartoInfowindow.prototype.moveMaptoOpen = function() {
		var left = 0;
		var top = 0;
		var div = this.div_;
	  var pixPosition = this.getProjection().fromLatLngToContainerPixel(this.latlng_);

		if ((pixPosition.x + this.offsetHorizontal_) < 0) {
			left = (pixPosition.x + this.offsetHorizontal_ - 20);
		}
		
		if ((pixPosition.x - this.offsetHorizontal_) >= ($('div#map').width())) {
			left = (pixPosition.x - this.offsetHorizontal_ - $('div#map').width() + 20);
		}
		
		if ((pixPosition.y - $(div).height()) < 0) {
			top = (pixPosition.y - $(div).height() - 30);
		}
				
		this.map_.panBy(left,top);
	}
