   
    /* Function to create all the map DOM elements */

    function createMapElements() {
      
      ///////////////////////////////////////
      //  Map header elements              //
      ///////////////////////////////////////
      $('div.map_window').append(
        '<div class="map_curtain"></div>'+
        '<div class="map_header">'+
          '<ul>'+
            '<li class="first">'+
              '<h4>Map type</h4>'+
              '<p>Roadmap</p>'+
              '<a class="open" href="#map_customization"></a>'+
              '<div class="options short">'+
                '<span class="tick"></span>'+
                '<ul class="map_type">'+
                  '<li class="selected">'+
                    '<a href="#">Roadmap</a>'+
                  '</li>'+
                  '<li>'+
                    '<a href="#">Satellite</a>'+
                  '</li>'+
                  '<li>'+
                    '<a href="#">Terrain</a>'+
                  '</li>'+
                  '<li class="disabled">'+
                    '<a href="#">Custom tiles</a>'+
                    '<div class="suboptions">'+
                    '</div>'+
                  '</li>'+
                '</ul>'+
              '</div>'+
            '</li>'+
            '<li>'+
              '<h4>Visualization type</h4>'+
              '<p>Features visualization</p>'+
            '</li>'+
            '<li>'+
              '<h4>Geometry customization</h4>'+
              '<p>Default style</p>'+
              '<a class="open" href="#geometry_customization"></a>'+
              '<div class="options">'+
                '<span class="tick"></span>'+
                '<ul class="geometry_customization">'+
                  '<li class="selected">'+
                    '<a href="#default">Default</a>'+
                  '</li>'+
                  '<li class="disabled points">'+
                    '<a href="#custom_points">Custom points</a>'+
                    '<div></div>'+
                  '</li>'+
                  '<li class="disabled polygons">'+
                    '<a href="#custom_polygons">Custom polygons</a>'+
                    '<div></div>'+
                  '</li>'+
                  '<li class="disabled lines">'+
                    '<a href="#custom_lines">Custom lines</a>'+
                    '<div></div>'+
                  '</li>'+
                '</ul>'+
              '</div>'+
            '</li>'+
            '<li>'+
              '<h4>Infowindow customization</h4>'+
              '<p>Default</p>'+
              '<a class="open" href="#infowindow_customization"></a>'+
              '<div class="short options">'+
                '<span class="tick"></span>'+
                '<ul class="infowindow_customization">'+
                  '<li class="selected">'+
                    '<a href="#default">Default</a>'+
                  '</li>'+
                  '<li class="disabled">'+
                    '<a href="#custom">Custom</a>'+
                  '</li>'+
                '</ul>'+
              '</div>'+
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
      
      
      ///////////////////////////////////////
      //  Map control elements             //
      ///////////////////////////////////////
      $('div.map_window').append(
        '<div id="zoom_control">'+
          '<a href="#zoom_in" class="zoom_in"></a>'+
          '<a href="#zoom_out" class="zoom_out"></a>'+
          '<span class="slider"></span>'+
        '</div>'+
        '<div class="loading">'+
          '<span class="loader"></span>'+
        '</div>'
      );
    }

    