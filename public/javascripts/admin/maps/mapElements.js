   
    var style = {};//{'marker-fill':'#FF6600','marker-line-color':'#FFFFFF'};
    var default_style = {};//{'marker-fill':'#FF6600','marker-line-color':'#FFFFFF'};
    var sql = null;//'(SELECT * FROM '+table_name+') as t';

    function createMapElements() {
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
              '<p>ROADMAP</p>'+
            '</li>'+
            '<li>'+
              '<h4>Visualization type</h4>'+
              '<p>Features visualization</p>'+
            '</li>'+
            '<li>'+
              '<h4>Markers customization <a href="#" style="text-decoration:underline;" id="carto_css">css</a></h4>'+
              '<p>Customized dots</p>'+
              '<a class="open" href="#open_map_type">open</a>'+
              '<span class="marker_customization">'+
                '<ul id="marker_customization_list">'+
                  '<li class="selected"><a>Default</a></li>'+
                  '<li><a>Custom dots</a>'+
                    '<div class="options">'+
                      '<label>Fill</label>'+
                      '<span class="color_block">'+
                        '<div param="marker-fill" class="color_preview" style="background-color:#FF6600"></div>'+
                        '<div class="color_picker"></div>'+
                      '</span>'+
                      '<span class="size">'+
                        '<input param="marker-width" type="text" value="8"/>'+
                        '<a class="more" href="#">more</a>'+
                        '<a class="less" href="#">less</a>'+
                      '</span>'+
                      '<label>Border</label>'+
                      '<span class="color_block">'+
                        '<div param="marker-line-color" class="color_preview" style="background-color:white"></div>'+
                        '<div class="color_picker"></div>'+
                      '</span>'+
                      '<span class="size">'+
                        '<input param="marker-line-width" type="text" value="3"/>'+
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
            '<li class="query">'+
              '<h4>Map query</h4>'+
              '<p><form id="query_form"><input type="text" value="SELECT * FROM '+table_name+'"/><input type="submit" value="SEND"/></form></p>'+
            '</li>'+
          '</ul>'+
        '</div>'+
        '<p class="georeferencing"></p>'+
        '<div id="map"></div>'+
        '<div class="css_editor">'+
          '<a class="close" href="#close">close</a>'+
          '<div class="inner_">'+
            '<span class="top">'+
              '<h3>Edit your tiles</h3>'+
              '<textarea id="css_editor">#'+ table_name +'{\n marker-fill: #FF6600;\n marker-opacity: 1;\n marker-width: 8;\n marker-line-color: white;\n marker-line-width: 3;\n marker-line-opacity: 0.9;\n marker-placement: point;\n marker-type: ellipse;\n marker-allow-overlap: true;\n}</textarea>'+
            '</span>'+
            '<span class="bottom">'+
              '<a href="#try" class="try_css">Try CSS</a>'+
              '<a href="#cancel" class="cancel">Cancel</a>'+
            '</span>'+
          '</div>'+
        '</div>'
      );
      
      
      /*CSS EDITOR*/
      css_editor = CodeMirror.fromTextArea(document.getElementById("css_editor"), {
        lineNumbers: false,
        mode: "css"
      });
      $('div.css_editor').draggable();

      
      //Navigate columns
      $('ul#marker_customization_list li').click(function(){
        if ($(this).hasClass('selected')) {
          return false;
        } else {
          $('ul#marker_customization_list li').removeClass('selected');
          $(this).addClass('selected');
          if ($(this).children('a').text()=="Default") {
            refreshLayer(default_style);
          } else {
            refreshLayer(style);
          }
        }
      });


      //Show colorpicker
      $('div.color_picker').ColorPicker({
        flat: true,
        onChange: function (hsb, hex, rgb) {
          $(this).parent().parent().children('div.color_preview').css('background-color','#'+hex);
          style[$(this).parent().parent().children('div.color_preview').attr('param')] = '#'+hex;
      	}
      });
      
      
      $('div a.open').click(function(ev){
        stopPropagation(ev);
        var visible = $(this).parent().children('span').is(':visible');
        if (visible) {
          $(this).parent().children('span').fadeOut();
        } else {
          $(this).parent().children('span').fadeIn();
          $('body').bind('click',function(ev){
            if (!$(ev.target).closest('span.marker_customization').length) {
              $('body').unbind('click');
              $('span.marker_customization').fadeOut();
            };
          });
        }
      });
      
      
      //More
      $('a.more').click(function(ev){
        stopPropagation(ev);
        var value = $(this).parent().children('input').val();
        $(this).parent().children('input').val(parseInt(value)+1);
        var param = $(this).parent().children('input').attr('param');
        style[param] = value;
        refreshLayer(style);
      });
      
      //Less
      $('a.less').click(function(ev){
        stopPropagation(ev);
        var value = $(this).parent().children('input').val();
        if (value!=0) {
          var param = $(this).parent().children('input').attr('param');
          style[param] = value;
          $(this).parent().children('input').val(value-1);
          refreshLayer(style);
        }
      });
      
      //width input
      $('span.size input').focusout(function(ev){
        stopPropagation(ev);
        var value = $(this).parent().children('input').val();
        var param = $(this).parent().children('input').attr('param');
        style[param] = value;
        refreshLayer(style);
      });
      
      //Open editor
      $('div.color_preview').click(function(ev){
        stopPropagation(ev);
        var visible = $(this).parent().children('div.color_picker').is(':visible');
        if (visible) {
          refreshLayer(style);
          $(document).unbind('click');
          $('div.color_picker').hide();
        } else {
          $('div.color_picker').hide();
          $(this).parent().children('div.color_picker').fadeIn();
          $(document).bind('click',function(ev){
            if (!$(ev.target).closest('div.color_picker').length) {
              $(document).unbind('click');
              $('div.color_picker').fadeOut();
              refreshLayer(style);
            };
          });
        }
      });


      //Zooms
      $('a.zoom_in').click(function(ev){
        stopPropagation(ev);
        map.setZoom(map.getZoom()+1);
      });
      $('a.zoom_out').click(function(ev){
        ev.stopPropagation();
        ev.preventDefault();
        map.setZoom(map.getZoom()-1);
      });



      //Query 
      $('#query_form input[type="text"]').livequery('focusin',function(ev){
        stopPropagation(ev);
        var value = $(this).val();
        if (value=='SELECT * FROM '+table_name+'') {
          $(this).val('');
          $(this).css('font-style','normal');
          $(this).css('color','#333333');
        }
      });
      
      $('#query_form input[type="text"]').livequery('focusout',function(ev){
        stopPropagation(ev);
        var value = $(this).val();
        if (value=='SELECT * FROM '+table_name+'' || value=='') {
          $(this).val('SELECT * FROM '+table_name+'');
          $(this).css('font-style','italic');
          $(this).css('color','#bbbbbb');
        }
      });
      
      
      $('#query_form').livequery('submit',function(ev){
        stopPropagation(ev);
        sql = '('+$('#query_form input[type="text"]').val()+') as t';
        refreshLayer(style);
      });
    }
    
    
    function closeMapElements() {
      $('div.color_picker').hide();
      $('span.marker_customization').hide();
    }
    