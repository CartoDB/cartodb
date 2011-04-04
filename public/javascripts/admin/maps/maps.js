
  //var map = null;
  var markers = [];
  var bounds;
  var geocoder;
  var image;
  var globalZindex = 1;
  var po;
  var map;
  var radius = 10, tips = {};
  var layer;
  var tile_url = 'http://ec2-50-16-103-51.compute-1.amazonaws.com/tiles/{X}/{Y}/{Z}';
  

  function initMap() {
    
    //head.js("/javascripts/admin/maps/CartoMarker.js");
    
    ///////////////////////////////////////
    //  Map elements                     //
    ///////////////////////////////////////
    $('div.map_window').append(
      '<div class="map_curtain"></div>'+
      '<a href="#zoom_in" class="zoom_in"></a>'+
      '<a href="#zoom_out" class="zoom_out"></a>'+
      '<p class="loading">Loading</p>'+
      '<div class="map_header">'+
        '<ul>'+
          '<li class="first">'+
            '<h4>Map type</h4>'+
            '<p>CloudMade</p>'+
          '</li>'+
          '<li>'+
            '<h4>Visualization type</h4>'+
            '<p>Features visualization</p>'+
          '</li>'+
          '<li>'+
            '<h4>Markers customization</h4>'+
            '<p>Customized dots</p>'+
          '</li>'+
          '<li>'+
            '<h4>Infowindow customization</h4>'+
            '<p>Default</p>'+
          '</li>'+
          '<li class="query">'+
            '<h4>Map query</h4>'+
            '<p><form id="query_form"><input type="text" value="SELECT * FROM '+table_name+'"/><input type="submit" value="SEND"/></form></p>'+
          '</li>'+
        '</ul>'+
      '</div>'+
      '<p class="georeferencing"></p>'+
      '<div id="map"></div>'
    );
    

    
    //Zooms
    $('a.zoom_in').click(function(ev){
      ev.stopPropagation();
      ev.preventDefault();
      map.zoom(map.zoom()+1);
    });
    $('a.zoom_out').click(function(ev){
      ev.stopPropagation();
      ev.preventDefault();
      map.zoom(map.zoom()-1);
    });
    
    
    
    //Query 

    $('#query_form input[type="text"]').livequery('focusin',function(ev){
      ev.stopPropagation();
      ev.preventDefault();
      var value = $(this).val();
      if (value=='SELECT * FROM '+table_name+'') {
        $(this).val('');
        $(this).css('font-style','normal');
        $(this).css('color','#333333');
      }
    });
    
    $('#query_form input[type="text"]').livequery('focusout',function(ev){
      ev.stopPropagation();
      ev.preventDefault();
      var value = $(this).val();
      if (value=='SELECT * FROM '+table_name+'' || value=='') {
        $(this).val('SELECT * FROM '+table_name+'');
        $(this).css('font-style','italic');
        $(this).css('color','#bbbbbb');
      }
    });
    
    
    $('#query_form').livequery('submit',function(ev){
      ev.stopPropagation();
      ev.preventDefault();
      var sql = '('+$('#query_form input[type="text"]').val()+') as t';
      if (sql!='') {
        layer.url(po.url(tile_url + '/1/' + escape(sql) + '/point')).reload();
      } else {
        layer.url(po.url(tile_url + '/1/'+table_name+'/point'));
      }
    });
  }



  function showMap() {
    $('div.map_window div.map_curtain').hide();
    $('p.georeferencing').hide();
      
    if (map==null) {
      po = org.polymaps;
      map = po.map()
          .container(document.getElementById('map').appendChild(po.svg('svg')))
          .center({lon: -1.3183, lat: 29.075})
          .zoom(2)
          .zoomRange([1, 20])
          .add(po.drag())
          .add(po.wheel())
          .add(po.dblclick());

          map.add(po.image()
              .url(po.url("http://{S}tile.cloudmade.com"
              + "/1a1b06b230af4efdbb989ea99e9841af"
              + "/998/256/{Z}/{X}/{Y}.png")
              .hosts(["a.", "b.", "c.", ""])));

          layer = po.image().url(po.url(tile_url + '/1/'+table_name+'/point'));
          map.add(layer);
    } else {
      layer.url(po.url(tile_url + '/1/'+table_name+'/point'));
    }
  }


  function hideMap() {
    $('div.map_window div.map_curtain').show();
  }
