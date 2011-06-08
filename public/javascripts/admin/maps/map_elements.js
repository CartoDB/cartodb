
    function createHeaderElements() {
      
      ///////////////////////////////////////
      //  Map elements                     //
      ///////////////////////////////////////
      $('div.map_window').append(
        '<div id="zoom_control">'+
          '<a href="#zoom_in" class="zoom_in"></a>'+
          '<a href="#zoom_out" class="zoom_out"></a>'+
          '<span class="slider"></span>'+
        '</div>'+
        '<div id="map_tools">'+
          '<ul>'+
            '<li><a class="select">select</a></li>'+
            '<li><a class="add">add</a></li>'+
            '<li><a class="select_area">select_area</a></li>'+
          '</ul>'+
          '<div class="tooltip">'+
            '<p>select</p>'+
            '<span class="arrow"></span>'+
          '</div>'+
        '</div>'+
        '<p class="loading">Loading</p>'
      );
      
      //Move terms and conditions
      setTimeout(function(){$('div#map').find('a:contains("Terms of Use")').closest('div').parent().removeAttr('class').addClass('terms');},1100)
      
      
      // Map tools
      $('div#map_tools a').hover(function(){
        // Change text
        var text = $(this).text().replace('_',' ');
        $('div#map_tools div.tooltip p').text(text);
        // Check position
        var right = -($(this).offset().left-$(window).width());
        var offset = $('div#map_tools div.tooltip').width()/2;
        // near right edge
        if (right-13-offset<0) {
          right = 16 + offset;
          $('div#map_tools div.tooltip span.arrow').css({left:'83%'});
        } else {
          $('div#map_tools div.tooltip span.arrow').css({left:'50%'});
        }
        $('div#map_tools div.tooltip').css({right:right-13-offset+'px'});        
        // Show
        $('div#map_tools div.tooltip').show();
      },function(){
        $('div#map_tools div.tooltip').hide();
      });
      
      
      //Zooms
      $('a.zoom_in').click(function(ev){
        stopPropagation(ev);
        var new_zoom = map.getZoom()+1;
        if (new_zoom<=20) {
          map.setZoom(new_zoom);
          $('span.slider').slider('value',new_zoom);
        }
      });
      $('a.zoom_out').click(function(ev){
        stopPropagation(ev);
        var new_zoom = map.getZoom()-1;
        if (new_zoom>=0) {
          map.setZoom(new_zoom);
          $('span.slider').slider('value',new_zoom);
        }
      });
      
      // Zoom slider
      $('span.slider').slider({
        orientation: 'vertical',
        min:0,
        max:20,
        value:1,
        change: function(event,ui){
          map.setZoom(ui.value);
        }
      });
    }

    
    
    