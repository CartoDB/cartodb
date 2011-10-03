   
    /* Function to create all the map DOM elements */

    function createMapElements() {
      
      ///////////////////////////////////////
      //  Map header elements              //
      ///////////////////////////////////////
      $('div.map_window').append(
        '<div class="map_curtain"></div>'+
        '<div class="map_header">'+
          '<ul class="main">'+
            '<li class="first">'+
              '<h4>Map type</h4>'+
              '<p>Roadmap</p>'+
              '<a class="open" href="#map_customization"></a>'+
              '<div class="options short">'+
                '<span class="tick"></span>'+
                '<ul class="map_type">'+
                  '<li class="selected">'+
                    '<a class="option" href="#">Roadmap</a>'+
                  '</li>'+
                  '<li>'+
                    '<a class="option" href="#">Satellite</a>'+
                  '</li>'+
                  '<li>'+
                    '<a class="option" href="#">Terrain</a>'+
                  '</li>'+
                  '<li class="disabled">'+
                    '<a class="option" href="#">Custom tiles</a>'+
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
                    '<a class="option" href="#default">Default</a>'+
                  '</li>'+
                  '<li class="points">'+
                    '<a class="option" href="#custom_points">Custom points</a>'+
                    '<div class="suboptions">'+
                      '<label>Fill</label>'+
                      '<div class="long">'+
                        '<span class="color" css="marker-fill">'+
                          '<a href="#change_fill_color" class="control"></a>'+
                          '<input type="text" value="#FF6600"/>'+
                        '</span>'+
                        '<span class="numeric" css="marker-width">'+
                          '<input disabled="disabled" class="range_value" type="text" value="8"/>'+
                          '<a href="#add_one_line_width" class="range_up" href="#range">+</a>'+
                          '<a href="#deduct_one_line_width" class="range_down" href="#range">-</a>'+
                        '</span>'+
                      '</div>'+
                      '<label>Border</label>'+
                      '<div class="long">'+
                        '<span class="color" css="marker-line-color">'+
                          '<a href="#change_line_color" class="control" style="background-color:white"></a>'+
                          '<input type="text" value="#FFFFFF"/>'+
                        '</span>'+
                        '<span class="numeric" css="marker-line-width">'+
                          '<input disabled="disabled" class="range_value" type="text" value="3"/>'+
                          '<a href="#add_one_line_width" class="range_up" href="#range">+</a>'+
                          '<a href="#deduct_one_line_width" class="range_down" href="#range">-</a>'+
                        '</span>'+
                      '</div>'+
                      '<label>Alpha</label>'+
                      '<div class="long">'+
                        '<span class="alpha" css="marker-opacity marker-line-opacity">'+
                          '<div class="slider"></div>'+
                          '<span class="tooltip">83%</span>'+
                        '</span>'+
                      '</div>'+
                    '</div>'+
                  '</li>'+
                  '<li class="polygons">'+
                    '<a class="option" href="#custom_polygons">Custom polygons</a>'+
                    '<div class="suboptions">'+
                      '<label>Fill</label>'+
                      '<div class="long">'+
                        '<span class="color" css="polygon-fill">'+
                          '<a href="#change_fill_color" class="control"></a>'+
                          '<input type="text" value="#FF6600"/>'+
                        '</span>'+
                      '</div>'+
                      '<label>Border</label>'+
                      '<div class="long">'+
                        '<span class="color" css="line-color">'+
                          '<a href="#change_line_color" class="control"></a>'+
                          '<input type="text" value="#FFFFFF"/>'+
                        '</span>'+
                        '<span class="numeric" css="line-width">'+
                          '<input disabled="disabled" class="range_value" type="text" value="3"/>'+
                          '<a href="#add_one_line_width" class="range_up" href="#range">+</a>'+
                          '<a href="#deduct_one_line_width" class="range_down" href="#range">-</a>'+
                        '</span>'+
                      '</div>'+
                      '<label>Alpha</label>'+
                      '<div class="long">'+
                        '<span class="alpha" css="polygon-opacity line-opacity">'+
                          '<div class="slider"></div>'+
                          '<span class="tooltip">83%</span>'+
                        '</span>'+
                      '</div>'+
                    '</div>'+
                  '</li>'+
                  '<li class="lines">'+
                    '<a class="option" href="#custom_lines">Custom lines</a>'+
                    '<div class="suboptions">'+
                      '<label>Line</label>'+
                      '<div class="long">'+
                        '<span class="color" css="line-color">'+
                          '<a href="#change_fill_color" class="control"></a>'+
                          '<input type="text" value="#FF6600"/>'+
                        '</span>'+
                        '<span class="numeric" css="line-width">'+
                          '<input disabled="disabled" class="range_value" type="text" value="8"/>'+
                          '<a href="#add_one_line_width" class="range_up" href="#range">+</a>'+
                          '<a href="#deduct_one_line_width" class="range_down" href="#range">-</a>'+
                        '</span>'+
                      '</div>'+
                      '<label>Alpha</label>'+
                      '<div class="long">'+
                        '<span class="alpha" css="line-opacity">'+
                          '<div class="slider"></div>'+
                          '<span class="tooltip">83%</span>'+
                        '</span>'+
                      '</div>'+
                    '</div>'+
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

    