

	function CartoInfowindow(latlng, map) {
	  this.latlng_ = latlng;
		this.marker_;
		this.map_ = map;
		this.columns_;
	
	  this.offsetHorizontal_ = -107;
	  this.width_ = 214;
	
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
	
			$(div).append('<a href="#close" class="close">x</a>'+
			              '<div class="top">'+
			              '</div>'+
			              '<div class="bottom">'+
											'<label>cartodb_id:1</label>'+
											'<a class="delete" href="#delete">Delete</a>'+
		                '</div>');
		

			$(div).find('a.close').click(function(ev){
				stopPropagation(ev);
				me.hide();
			});

			$(div).find('a.delete').click(function(ev){
				stopPropagation(ev);
				me.hide();
				carto_map.delete_window_.open(me.latlng_,me.marker_);
			});
										

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
	
			$(div).css({opacity:0});
	  }
	
	  var pixPosition = this.getProjection().fromLatLngToDivPixel(this.latlng_);
	  if (pixPosition) {
		  div.style.width = this.width_ + 'px';
		  div.style.left = (pixPosition.x - 49) + 'px';
		  var actual_height = - $(div).height();
		  div.style.top = (pixPosition.y + actual_height + 5) + 'px';
	  }
	};
	
	
	CartoInfowindow.prototype.setPosition = function() {
	  
	  if (this.div_) { 
  	  var div = this.div_;
  	  var pixPosition = this.getProjection().fromLatLngToDivPixel(this.latlng_);
  	  if (pixPosition) {
  		  div.style.width = this.width_ + 'px';
  		  div.style.left = (pixPosition.x - 49) + 'px';
  		  var actual_height = - $(div).height();
  		  div.style.top = (pixPosition.y + actual_height + 5) + 'px';
  	  }
  	  this.show();
    }
	}
	
	
	CartoInfowindow.prototype.open = function(marker){
	  
	  if (this.div_) {
	    var div = this.div_;
	    this.latlng_ = marker.getPosition();
			this.marker_ = marker;
	
	    $(div).find('div.top').html('');
	    
	    var marker_data = marker.data;
	    
	    _.each(this.columns_,function(label){
				$(div).find('div.top').append('<label>'+label+'</label><input type="text" rel="'+label+'" value="'+(marker.data[label]!=null?marker.data[label]:'Empty field')+'" />');
	    });
	
			$(div).find('div.bottom').find('label').html('cartodb_id: <strong>'+marker.data.cartodb_id+'</strong>');
	
	    
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


	CartoInfowindow.prototype.isVisible = function(marker_id) {
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
	
	
	CartoInfowindow.prototype.moveMaptoOpen = function() {
		var left = 0;
		var top = 0;
		var div = this.div_;
	  var pixPosition = this.getProjection().fromLatLngToContainerPixel(this.latlng_);

		if ((pixPosition.x + this.offsetHorizontal_) < 0) {
			left = (pixPosition.x + this.offsetHorizontal_ - 20);
		}
		
		if ((pixPosition.x + 180) >= ($('div#map').width())) {
			left = (pixPosition.x + 180 - $('div#map').width());
		}
		
		if ((pixPosition.y - $(div).height()) < 0) {
			top = (pixPosition.y - $(div).height() - 30);
		}
				
		this.map_.panBy(left,top);
	}
