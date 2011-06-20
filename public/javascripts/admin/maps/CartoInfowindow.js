

	function CartoInfowindow(latlng, info, map) {
	  this.latlng_ = latlng;
		this.info_ = info;
		this.map_ = map;
	
	  this.offsetVertical_ = -230;
	  this.offsetHorizontal_ = -116;
	  this.height_ = 245;
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
	
			console.log(div);

			// google.maps.event.addDomListener(div,'mousedown',function(ev){ 
			// 		    try{
			// 		ev.stopPropagation();
			// 	}catch(e){
			// 		event.cancelBubble=true;
			// 	}; 
			// 		  });

			
	    var panes = this.getPanes();
	    panes.floatPane.appendChild(div);
	
	
			this.moveMaptoOpen();
	  }

		var pixPosition = me.getProjection().fromLatLngToDivPixel(me.latlng_);
	  if (pixPosition) {
		  div.style.width = me.width_ + 'px';
		  div.style.left = (pixPosition.x + me.offsetHorizontal_) + 'px';
		  div.style.height = me.height_ + 'px';
		  div.style.top = (pixPosition.y + me.offsetVertical_ - (($(div).css('opacity') == 1)? 10 : 0)) + 'px';
	  }
			
		if ($(div).css('opacity') == 0) {
			$(div).animate({
		    top: '-=' + 10 + 'px',
		    opacity: 1
		  }, 250, 'swing');
		}
	};


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
		
	  var pixPosition = this.getProjection().fromLatLngToContainerPixel(this.latlng_);

		if ((pixPosition.x + this.offsetHorizontal_) < 0) {
			left = (pixPosition.x + this.offsetHorizontal_ - 20);
		}
		
		if ((pixPosition.x - this.offsetHorizontal_) >= ($('div#map').width())) {
			left = (pixPosition.x - this.offsetHorizontal_ - $('div#map').width() + 20);
		}
		
		if ((pixPosition.y + this.offsetVertical_) < 0) {
			top = (pixPosition.y + this.offsetVertical_ - 10);
		}
		
		this.map_.panBy(left,top);
	}
