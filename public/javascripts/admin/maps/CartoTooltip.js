
		function CartoTooltip(latlng, marker_id, map) {
		  this.latlng_ = latlng;
			this.marker_id = marker_id;
		  this.offsetVertical_ = -21;
		  this.offsetHorizontal_ = 1;
		  this.height_ = 22;
		  this.width_ = 57;
		  this.setMap(map);
		}

		CartoTooltip.prototype = new google.maps.OverlayView();

		CartoTooltip.prototype.draw = function() {
		  var me = this;

		  var div = this.div_;
		  if (!div) {
		    div = this.div_ = document.createElement('DIV');
				div.setAttribute('class','marker_tooltip');
				div.style.zIndex = global_zIndex;
				
				$(div).append('<a href="#show_info">i</a><a class="margin" href="#delete_marker">x</a>');

				// $(div).hover(function(){
				// 	over_mini_tooltip = true;
				// }, function(){			
				// 	over_mini_tooltip = false;
				// 	setTimeout(function(ev){
				// 		if (!over_marker) {
				// 			me.hide();
				// 		}
				// 	},50);
				// });

				// var button_i = document.createElement('a');
				// 		    button_i.style.position = "absolute";
				// button_i.style.left = "4px";
				// button_i.style.top = "4px";
				// button_i.style.width = "14px";
				// button_i.style.height = "14px";		
				// button_i.style.background = "url(/images/editor/over_i.png) no-repeat 0 0";
				// button_i.style.cursor = "pointer";
				// $(button_i).click(function(ev){
				// 	try{ev.stopPropagation();}catch(e){event.cancelBubble=true;};
				// 	me.showInformation();
				// });
				// $(button_i).hover(function(ev){
				// 	$(this).css('background-position','0 -14px');
				// }, function(ev){
				// 	$(this).css('background-position','0 0');
				// });
				// div.appendChild(button_i);




				// var button_x = document.createElement('a');
				// 		    button_x.style.position = "absolute";
				// button_x.style.left = "38px";
				// button_x.style.top = "4px";
				// button_x.style.width = "14px";
				// button_x.style.height = "14px";		
				// button_x.style.background = "url(/images/editor/over_x.png) no-repeat 0 0";
				// button_x.style.cursor = "pointer";
				// $(button_x).click(function(ev){
				// 	try{ev.stopPropagation();}catch(e){event.cancelBubble=true;};
				// 	me.deleteMarker();
				// });
				// $(button_x).hover(function(ev){
				// 	$(this).css('background-position','0 -14px');
				// }, function(ev){
				// 	$(this).css('background-position','0 0');
				// });
				// div.appendChild(button_x);


		    var panes = this.getPanes();
		    panes.floatPane.appendChild(div);
		  }

		  // Position the overlay 
		  var pixPosition = this.getProjection().fromLatLngToDivPixel(this.latlng_);
		  if (pixPosition) {
			  div.style.width = this.width_ + "px";
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

		CartoTooltip.prototype.getPosition = function() {
		 return this.latlng_;
		};


		CartoTooltip.prototype.changePosition = function(latlng,marker_id) {
			if (this.div_) {
				this.marker_id = marker_id;
				this.latlng_ = latlng;
				var div = this.div_;
				div.style.zIndex = global_zIndex + 1;
			  var pixPosition = this.getProjection().fromLatLngToDivPixel(latlng);
			  if (pixPosition) {
				  div.style.left = (pixPosition.x + this.offsetHorizontal_) + "px";
				  div.style.top = (pixPosition.y + this.offsetVertical_) + "px";
			  }
		  }
		}


		CartoTooltip.prototype.deleteMarker = function() {
			this.hide();
			removeMarkers([{catalogue_id: this.marker_id}]);
		}


		// MarkerOverTooltip.prototype.makeActive = function() {
		// 	this.hide();
		// 	makeActive([{catalogue_id: this.marker_id}],false);
		// }
		// 
		// 
		// MarkerOverTooltip.prototype.showInformation = function() {
		// 	this.hide();
		// 	if (click_infowindow!=null) {					
		// 		if (occurrences[this.marker_id].data.catalogue_id == click_infowindow.marker_id || !click_infowindow.isVisible()) {
		// 			click_infowindow.changePosition(occurrences[this.marker_id].getPosition(),occurrences[this.marker_id].data.catalogue_id,occurrences[this.marker_id].data);
		// 		}
		// 	} else {
		// 		click_infowindow = new MarkerTooltip(occurrences[this.marker_id].getPosition(), occurrences[this.marker_id].data.catalogue_id, occurrences[this.marker_id].data, map);
		// 	}
		// }		



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
