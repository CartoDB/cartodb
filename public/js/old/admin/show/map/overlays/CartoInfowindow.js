

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
			              '<div class="outer_top">'+
			                '<div class="top scrollPane">'+
			                '</div>'+
			              '</div>'+
			              '<div class="bottom">'+
											'<label>id:1</label>'+
											'<a class="edit_point" href="#edit">edit</a>'+
											'<a class="delete_point" href="#delete">delete</a>'+
		                '</div>');
		

			$(div).find('a.close').click(function(ev){
				stopPropagation(ev);
				window.map.carto_map.unbindMapESC();
				me.hide();
			});

			$(div).find('a.delete_point').click(function(ev){
				stopPropagation(ev);
				me.hide();
				window.map.carto_map.delete_window_.open(me.latlng_,me.marker_,me.pixel);
			});
			
			$(div).find('a.edit_point').click(function(ev){
				stopPropagation(ev);
				me.hide();
				window.map.carto_map.createFakeGeometry(me.marker_);
			});
      
      google.maps.event.addDomListener(div, 'click', function (ev) {
        ev.preventDefault ? ev.preventDefault() : ev.returnValue = false;
      });
      google.maps.event.addDomListener(div, 'dblclick', function (ev) {
        ev.preventDefault ? ev.preventDefault() : ev.returnValue = false;
      });
      google.maps.event.addDomListener(div, 'mousedown', function (ev) {
        ev.preventDefault ? ev.preventDefault() : ev.returnValue = false;
        ev.stopPropagation ? ev.stopPropagation() : window.event.cancelBubble = true;
      });
      google.maps.event.addDomListener(div, 'mouseup', function (ev) {
        ev.preventDefault ? ev.preventDefault() : ev.returnValue = false;
      });
      google.maps.event.addDomListener(div, 'mousewheel', function (ev) {
        ev.stopPropagation ? ev.stopPropagation() : window.event.cancelBubble = true;
      });
      google.maps.event.addDomListener(div, 'DOMMouseScroll', function (ev) {
        ev.stopPropagation ? ev.stopPropagation() : window.event.cancelBubble = true;
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
  		  div.style.top = (pixPosition.y  + (this.pixel?(10+actual_height):(actual_height - 205))) + 'px';
  	  }
			
  	  this.show();
    }
	}
	
	
	CartoInfowindow.prototype.open = function(feature,pixel,latlng){
	  var me = this;
	  this.marker_ = feature;

	  $.ajax({
      method: "GET",
      url:global_api_url + 'tables/'+table_name+'/records/'+feature,
      headers: {"cartodbclient": true},
      success:function(data){
				positionateInfowindow(me,data,window.map.carto_map.infowindow_vars_);
      },
      error:function(e){}
    });
    
    
    function positionateInfowindow(me,info,variables) {
      if (me.div_) {
        // Set ESC binding
        window.map.carto_map.bindMapESC();
        
  	    var div = me.div_;

  	    // If we dont have the pixel position go and get latlng position
				if (pixel!=null) {
	  	    me.latlng_ = window.map.carto_map.map_canvas_.transformCoordinates(new google.maps.Point(pixel.x,pixel.y));
					me.pixel = pixel;
				} else {
	  	    me.latlng_ = latlng;
					me.pixel = null;
				}
  	    
  	    var query_mode = $('body').hasClass('query');

  	    // Reinitialize jscrollpane in the infowindow
     		$('div.marker_infowindow div.scrollPane').jScrollPane().data().jsp.destroy();

        // Remove the list items
  	    $(div).find('div.top').html('');
        
  	    _.each(info,function(value,label){
  	      if ((label!='cartodb_id' && variables[label])) {
    				$(div).find('div.top').append('<label>'+label+'</label><p class="'+((info[label]!=null)?'':'empty')+'">'+value+'</p>');
  	      }
  	    });
        
        // Initialize jscrollPane
        $('div.marker_infowindow div.scrollPane').jScrollPane({autoReinitialise:true});


  	    // If app in query mode?
  	    if (query_mode) {
  	      $(div).find('a.delete_point').hide();
    			$(div).find('a.edit_point').hide();
  	    } else {
  	      $(div).find('a.delete_point').show();
    			$(div).find('a.edit_point').show();
  	    }

  			$(div).find('div.bottom').find('label').html('id: <strong>'+info.cartodb_id+'</strong>');

  			me.setPosition();			
  	    me.moveMaptoOpen();
  	  }
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
