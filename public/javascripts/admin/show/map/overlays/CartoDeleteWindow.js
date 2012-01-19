

	function CartoDeleteWindow(latlng, map) {
	  this.latlng_ = latlng;
		this.map_ = map;

		this.height_ = 130;
		this.width_ = 206;
	  this.offsetHorizontal_ = -105;
	  this.offsetVertical_ = -123;
	

	  this.setMap(map);
	}


	CartoDeleteWindow.prototype = new google.maps.OverlayView();


	CartoDeleteWindow.prototype.draw = function() {
				
	  var me = this;
		var num = 0;
	

	  var div = this.div_;
	  if (!div) {
	    div = this.div_ = document.createElement('div');
	    div.setAttribute('class','marker_deletewindow');

			$(div).append('<div class="top">'+
											'<p>You are about to delete this row. Are you sure?</p>'+
			              '</div>'+
			              '<div class="bottom">'+
											'<a href="#nooo" class="cancel">cancel</a>'+
											'<a href="#delete" class="delete_point">Yes, delete</a>'+
		                '</div>');
	


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

			$(div).find('a.cancel').click(function(ev){
				stopPropagation(ev);
				me.hide();
			});
			
			$(div).find('a.delete_point').click(function(ev){
				stopPropagation(ev);
				me.hide();
				window.map.carto_map.removeGeometries(me.markers_);
			});

			$(div).css({opacity:0});
	  }

	  var pixPosition = this.getProjection().fromLatLngToDivPixel(this.latlng_);
	  if (pixPosition) {
		  div.style.width = this.width_ + 'px';
			div.style.height = this.height_ + 'px';
		  div.style.left = (pixPosition.x + this.offsetHorizontal_) + 'px';
		  div.style.top = (pixPosition.y + this.offsetVertical_) + 'px';
	  }
	};


	CartoDeleteWindow.prototype.setPosition = function() {
  
	  if (this.div_) { 
		  var div = this.div_;
		  var pixPosition = this.getProjection().fromLatLngToDivPixel(this.latlng_);
		  if (pixPosition) {
			  div.style.width = this.width_ + 'px';
				div.style.height = this.height_ + 'px';
			  div.style.left = (pixPosition.x + this.offsetHorizontal_) + 'px';
			  div.style.top = (pixPosition.y + this.offsetVertical_ - this.height_ - 76) + (this.pixel?205:0) + 'px';
		  }
		  this.show();
	  }
	}


	CartoDeleteWindow.prototype.open = function(latlng,markers_ids,pixel){
  
	  if (this.div_) {
	    var div = this.div_;
	    this.latlng_ = latlng;
			this.markers_ = markers_ids;
			this.pixel = pixel;
    
	    this.moveMaptoOpen();
	    this.setPosition();			
	  }
	}


	CartoDeleteWindow.prototype.hide = function() {
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


	CartoDeleteWindow.prototype.show = function() {
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


	CartoDeleteWindow.prototype.isVisible = function(marker_id) {
	  if (this.div_) {
	    var div = this.div_;
			if ($(div).css('visibility')=='visible' && this.marker_!=null && this.marker_.data.cartodb_id==marker_id) {
				return true;
			} else {
				return false;
			}
		} else {
			return false;
		}
	}


	CartoDeleteWindow.prototype.moveMaptoOpen = function() {
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
