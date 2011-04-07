
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
  var style = {};


  function initMap() {
        
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
            '<a class="open" href="#open_map_type">open</a>'+
            '<span class="marker_customization">'+
              '<ul>'+
                '<li><a>Default</a></li>'+
                '<li class="selected"><a>Custom dots</a>'+
                  '<div class="options">'+
                    '<label>Fill</label>'+
                    '<span class="color_block">'+
                      '<div param="marker-fill" class="color_preview"></div>'+
                      '<div class="color_picker"></div>'+
                    '</span>'+
                    '<span class="size">'+
                      '<input type="text" value="1"/>'+
                      '<a class="more" href="#">more</a>'+
                      '<a class="less" href="#">less</a>'+
                    '</span>'+
                    '<label>Border</label>'+
                    '<span class="color_block">'+
                      '<div param="marker-line-color" class="color_preview"></div>'+
                      '<div class="color_picker"></div>'+
                    '</span>'+
                    '<span class="size">'+
                      '<input type="text" value="1"/>'+
                      '<a class="more" href="#">more</a>'+
                      '<a class="less" href="#">less</a>'+
                    '</span>'+
                  '</div>'+
                '</li>'+
                '<li class="disabled"><a>Image markers</a></li>'+
                '<li class="disabled"><a>Thematic mapping</a></li>'+
              '</ul>'+
            '</span>'+
          '</li>'+
          '<li>'+
            '<h4>Infowindow customization</h4>'+
            '<p>Default</p>'+
          '</li>'+
          // '<li class="query">'+
          //   '<h4>Map query</h4>'+
          //   '<p><form id="query_form"><input type="text" value="SELECT * FROM '+table_name+'"/><input type="submit" value="SEND"/></form></p>'+
          // '</li>'+
        '</ul>'+
      '</div>'+
      '<p class="georeferencing"></p>'+
      '<div id="map"></div>'
    );
    
    //Show colorpicker
    $('div.color_picker').ColorPicker({
      flat: true,
      onChange: function (hsb, hex, rgb) {
        $(this).parent().parent().children('div.color_preview').css('background-color','#'+hex);
        style[$(this).parent().parent().children('div.color_preview').attr('param')] = '#'+hex;
    	}
    });

    
    $('div.color_preview').click(function(ev){
      stopPropagation(ev);
      var visible = $(this).parent().children('div.color_picker').is(':visible');
      if (visible) {
        refreshLayer();
        $(this).parent().children('div.color_picker').hide();
      } else {
        $(this).parent().children('div.color_picker').show();
      }
    });
    
    
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
    // $('#query_form input[type="text"]').livequery('focusin',function(ev){
    //   ev.stopPropagation();
    //   ev.preventDefault();
    //   var value = $(this).val();
    //   if (value=='SELECT * FROM '+table_name+'') {
    //     $(this).val('');
    //     $(this).css('font-style','normal');
    //     $(this).css('color','#333333');
    //   }
    // });
    // 
    // $('#query_form input[type="text"]').livequery('focusout',function(ev){
    //   ev.stopPropagation();
    //   ev.preventDefault();
    //   var value = $(this).val();
    //   if (value=='SELECT * FROM '+table_name+'' || value=='') {
    //     $(this).val('SELECT * FROM '+table_name+'');
    //     $(this).css('font-style','italic');
    //     $(this).css('color','#bbbbbb');
    //   }
    // });
    // 
    // 
    // $('#query_form').livequery('submit',function(ev){
    //   ev.stopPropagation();
    //   ev.preventDefault();
    //   var sql = '('+$('#query_form input[type="text"]').val()+') as t';
    //   if (sql!='') {
    //     layer.url(po.url(tile_url + '/1/' + escape(sql) + '/point')).reload();
    //   } else {
    //     layer.url(po.url(tile_url + '/1/'+table_name+'/point'));
    //   }
    // });
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

          layer = po.image().url(po.url(tile_url + '/1/'+table_name+'/'+(($.isEmptyObject(style))?'point':encodeURIComponent(JSON.stringify(style)))));
          map.add(layer);
    } else {
      layer.url(po.url(tile_url + '/1/'+table_name+'/'+(($.isEmptyObject(style))?'point':encodeURIComponent(JSON.stringify(style)))));
    }
  }


  function hideMap() {
    $('div.map_window div.map_curtain').show();
  }
  
  
  function refreshLayer() {
    layer.url(tile_url + '/1/'+table_name+'/'+encodeURIComponent(JSON.stringify(style)));
    layer.reload();
  }
