
  function GeometryCreator(map,type) {
    this.map = map;
    this.type = type;
    this.pen = new Pen(this.map,this);
    this.geometries = new Array();
    
    var thisOjb = this;
    this.event = google.maps.event.addListener(thisOjb.map,'click',function(event) {
      thisOjb.pen.draw(event.latLng);
    });

    
    // Show edit tools
    window.map.carto_map.toggleEditTools();
    
    // Reset previous links
    $('.general_options ul li.edit a.complete').unbind('click');
    $('.general_options ul li.edit a.discard').unbind('click');
        
    // Bind links
    $('.general_options ul li.edit a.complete').click(function(ev){
			if ((thisOjb.type == "MultiLineString" || thisOjb.type == "LineString") && (thisOjb.pen.polyline)) {
				thisOjb.geometries.push(thisOjb.pen.polyline.polylineObj);
			}
	
      stopPropagation(ev);

      if (thisOjb.geometries.length>0) {
				var new_geometry = transformToGeoJSON(thisOjb.geometries,thisOjb.type);
	      var geojson = $.parseJSON(new_geometry);
        var params = {};
        params.the_geom = new_geometry;
        window.map.carto_map.updateTable('/records',params,new_geometry,null,"adding","POST");
      }
      $('.general_options ul li.map a.select').click();
      window.map.carto_map.toggleEditTools();
      thisOjb.destroy();
      window.map.carto_map.geometry_creator_ = null;
    });
    
    $('.general_options ul li.edit a.discard').click(function(ev){
      stopPropagation(ev);
      $('.general_options ul li.map a.select').click();
      window.map.carto_map.toggleEditTools();
      thisOjb.destroy();
      window.map.carto_map.geometry_creator_ = null;
    });
    
    
    this.showGeoJSON = function() {
      return transformToGeoJSON(this.geometries,this.type);
    }


    this.destroy=function() {
      this.pen.deleteMis();
      if (null!=this.pen.polygon) {
        this.pen.polygon.remove();
      }
      if (null!=this.pen.polyline) {
        this.pen.polyline.remove();
      }
  
      _.each(this.geometries,function(geo_obj,i) {
        geo_obj.stopEdit();
        geo_obj.setMap(null);
      });
      this.geometries = new Array();
      google.maps.event.removeListener(this.event);
    }
  }


  function Pen(map,polygon_creator) {   
    this.map=map;
    this.listOfDots=new Array();
    this.polyline=null;
    this.geometry=null;
    this.currentDot=null;
    this.parent = polygon_creator;

    this.draw=function(latLng) {
      if(this.currentDot!=null&&this.listOfDots.length>1&&this.currentDot==this.listOfDots[0]) {
        this.drawGeometry(this.listOfDots);
        this.setGeometriesClickable(true);
      } else {
        this.setGeometriesClickable(false);
        if(null!=this.polyline) {
          this.polyline.remove();
        }
        var dot=new Dot(latLng,this.map,this);
        this.listOfDots.push(dot);
        if(this.listOfDots.length>1) {
          this.polyline=new Line(this.listOfDots,this.map);
        }
      }
    }

    this.addGeometry = function(geometry) {
      this.parent.geometries.push(geometry);
    }

    this.setGeometriesClickable = function(bool) {
      _.each(this.parent.geometries,function(geometry,i) {
        geometry.setOptions({clickable:bool});
        if (!bool) {
          geometry.stopEdit();
        }
      });
    }

    this.drawGeometry=function(listOfDots,color,des,id) {
      if (this.parent.type=="MultiLineString") {
        this.geometry = new Polyline(listOfDots,this.map,this,color,des,id);
      } else {
        this.geometry = new Polygon(listOfDots,this.map,this,color,des,id);
      }
      this.deleteMis();
    }

    this.deleteMis=function() {
      $.each(this.listOfDots,function(index,value) {
        value.remove();
      });
      this.listOfDots.length=0;
      if(null!=this.polyline) {
        this.polyline.remove();
        this.polyline=null;
      }
    }

    this.cancel=function() {
      if(null!=this.geometry) {
        (this.geometry.remove());
      }
      this.geometry=null;
      this.deleteMis();
    }

    this.setCurrentDot=function(dot) {
      this.currentDot=dot;
    }

    this.getListOfDots=function() {
      return this.listOfDots;
    }

    this.getData=function() {
      if (this.geometry!=null) {
        var data="";
        var paths=this.geometry.getPlots();
        paths.getAt(0).forEach(function(value,index) {
          data+=(value.toString());
        });
        return data;
      } else {
        return null;
      }
    }


    this.getColor=function() {
      if(this.polygon!=null) {
        var color=this.geometry.getColor();
        return color;
      } else {
        return null;
      }
    }
  }


  function Dot(latLng,map,pen) {
    this.latLng=latLng;
    this.parent=pen;

    var image = new google.maps.MarkerImage('/images/admin/map/vertex.png',new google.maps.Size(11, 11),new google.maps.Point(0,0),new google.maps.Point(5, 5));

    this.markerObj=new google.maps.Marker({position:this.latLng,map:map,icon:image});
    this.addListener=function() {
      var parent=this.parent;
      var thisMarker=this.markerObj;
      var thisDot=this;
      google.maps.event.addListener(thisMarker,'click',function() {
        parent.setCurrentDot(thisDot);
        parent.draw(thisMarker.getPosition());
      });
    }

    this.addListener();
    this.getLatLng=function() {
      return this.latLng;
    }

    this.getMarkerObj=function() {
      return this.markerObj;
    }

    this.remove=function() {
      this.markerObj.setMap(null);
    }
  }


  function Line(listOfDots,map) {
    this.listOfDots=listOfDots;
    this.map=map;
    this.coords=new Array();
    this.polylineObj=null;
    if (this.listOfDots.length>1) {
      var thisObj=this;
      $.each(this.listOfDots,function(index,value) {
        thisObj.coords.push(value.getLatLng());
      });
      this.polylineObj=new google.maps.Polyline({path:this.coords,strokeColor:"#FF6600",strokeOpacity:1.0,strokeWeight:2,map:this.map});
    }

    this.remove=function() {
      this.polylineObj.setMap(null);
    }
  }


  function Polygon(listOfDots,map,pen,color) {
    this.listOfDots=listOfDots;
    this.map=map;
    this.coords=new Array();
    this.parent=pen;
    var thisObj=this;
    $.each(this.listOfDots,function(index,value) {
      thisObj.coords.push(value.getLatLng());
    });

    
    this.polygonObj=new google.maps.Polygon({paths:this.coords,strokeColor:"#FFFFFF",strokeOpacity:1,strokeWeight:2,fillColor:"#FF6600",fillOpacity:0.5,map:this.map,clickable:true});

    // Now the polygons are clickable
    this.parent.setGeometriesClickable(true);

    // Lets add this polygon to the array
    this.parent.addGeometry(this.polygonObj);


    google.maps.event.addListener(this.polygonObj,'click',function(ev){
      if (this.clickable) {
        this.runEdit();
      }
    });

    this.remove=function(){
      this.polygonObj.setMap(null);
    }

    this.getContent=function(){
      return this.des;
    }

    this.getPolygonObj=function(){
      return this.polygonObj;
    }

    this.getListOfDots=function(){
      return this.listOfDots;
    }

    this.getPlots=function(){
      return this.polygonObj.getPaths();
    }
  }
  
  
  function Polyline(listOfDots,map,pen,color) {
    this.listOfDots=listOfDots;
    this.map=map;
    this.coords=new Array();
    this.parent=pen;
    var thisObj=this;
    $.each(this.listOfDots,function(index,value) {
      thisObj.coords.push(value.getLatLng());
    });

    this.polylineObj=new google.maps.Polyline({path:this.coords,strokeColor:"#FF6600",strokeOpacity:1.0,strokeWeight:2,map:this.map,clickable:true});

    // Now the polylines are clickable
    this.parent.setGeometriesClickable(true);

    // Lets add this polyline to the array
    this.parent.addGeometry(this.polylineObj);


    google.maps.event.addListener(this.polylineObj,'click',function(ev){
      if (this.clickable) {
        this.runEdit();
      }
    });

    this.remove=function(){
      this.polylineObj.setMap(null);
    }

    this.getContent=function(){
      return this.des;
    }

    this.getPolygonObj=function(){
      return this.polylineObj;
    }

    this.getListOfDots=function(){
      return this.listOfDots;
    }

    this.getPlots=function(){
      return this.polylineObj.getPaths();
    }
  }