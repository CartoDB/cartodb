function ClubMarker(latlng, info, map) {
  this.latlng_ = latlng;
	this.inf = info;
	this.map_ = map;

  this.offsetVertical_ = -12;
  this.offsetHorizontal_ = -13;
  this.height_ = 25;
  this.width_ = 25;

  this.setMap(map);
}

ClubMarker.prototype = new google.maps.OverlayView();

ClubMarker.prototype.draw = function() {

  var me = this;
	var num = 0;

  var div = this.div_;
  if (!div) {
    div = this.div_ = document.createElement('DIV');
    $(div).addClass('clubMarker');
    div.style.border = "none";
    div.style.position = "absolute";
		div.style.width = '25px';
		div.style.height = '25px';


    var content = ""+
      "<a class='clubMarker'>marker</a>"+
      "<div class='hidden'>"+
        "<a href='#close' class='close'>close</a>"+
        "<h3>"+this.inf.cartodb_id+"</h3>"+
        "<div class='content'>"+
          "<img src='http://chengdu.zonalibre.org/archives/bar%20gay%20patrocinado%20por%20Barcadi.JPG'/>"+
          "<p>La distancia a donde te encuentras es de "+((this.inf.distance.toFixed(0)>1000)?((this.inf.distance/1000).toFixed(2)+' km'):(this.inf.distance.toFixed(0))+' metros')+"</p>"+
        "</div>"+
      "</div>";

    $(div).append(content);
    

    var panes = this.getPanes();
    panes.floatPane.appendChild(div);
    
    $('a.close').click(function(ev){
      ev.stopPropagation();
      ev.preventDefault();
      $('div.hidden').hide();
    });
    
    
    $(div).click(function(ev){
      ev.stopPropagation();
      ev.preventDefault();
      $('div.hidden').hide();
      $(this).children('div.hidden').fadeIn('fast',function(){
        me.moveMaptoOpen();
      });
    });
    
    $('a.clubMarker').live('hover',function(ev){
      ev.stopPropagation();
      ev.preventDefault();
      globalIndex++;
      $(this).parent().css('zIndex',globalIndex);
    });
  }

	var pixPosition = me.getProjection().fromLatLngToDivPixel(me.latlng_);
  if (pixPosition) {
	  div.style.width = me.width_ + 'px';
	  div.style.left = (pixPosition.x + me.offsetHorizontal_) + 'px';
	  div.style.height = me.height_ + 'px';
	  div.style.top = (pixPosition.y + me.offsetVertical_) + 'px';
  }

};

ClubMarker.prototype.remove = function() {
  if (this.div_) {
    this.div_.parentNode.removeChild(this.div_);
    this.div_ = null;
  }
};

ClubMarker.prototype.hide = function() {
  if (this.div_) {
    $(this.div_).find('div').fadeOut();
  }
};

ClubMarker.prototype.getPosition = function() {
 return this.latlng_;
};


ClubMarker.prototype.moveMaptoOpen = function() {
	var left = 0;
	var top = 0;

  var pixPosition = this.getProjection().fromLatLngToContainerPixel(this.latlng_);


  if ((pixPosition.x + this.offsetHorizontal_) < 110) {
   left = (pixPosition.x + this.offsetHorizontal_ - 110);
  }

  if (($('div#map').width() - pixPosition.x + this.offsetHorizontal_) < 105) {
   left = 105 - $('div#map').width() + pixPosition.x - this.offsetHorizontal_;
  }

	if ((pixPosition.y + this.offsetVertical_) < 205) {
		top = pixPosition.y + this.offsetVertical_ - 205;
	}

	map.panBy(left,top);
}