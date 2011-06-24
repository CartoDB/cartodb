
		function CartoTooltip(latlng, map) {
		  this.latlng_ = latlng;
			this.marker_;
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
				
				$(div).append('<a class="info" href="#show_info">i</a><a class="margin delete" href="#delete_marker">x</a>');
				
				$(div).find('a.info').click(function(ev){
					stopPropagation(ev);
					me.hide();
					carto_map.info_window_.open(me.marker_);
				});
				
				$(div).find('a.delete').click(function(ev){
					stopPropagation(ev);
					me.hide();
					carto_map.delete_window_.open(me.latlng_,me.marker_);
				});
				
				$(div).hover(
					function(){
						carto_map.over_marker_ = true;
					},
					function(){
						carto_map.over_marker_ = false;
						setTimeout(function(){
							if (!carto_map.over_marker_) me.hide();
						},100);
					}
				);

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


		CartoTooltip.prototype.open = function(latlng,marker) {
			if (this.div_) {
				this.marker_ = marker;
				this.latlng_ = latlng;
				var div = this.div_;
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
