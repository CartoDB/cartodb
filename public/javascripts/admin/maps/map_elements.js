   
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
                  '<li>'+
                    '<a class="option" href="#">CartoDB</a>'+
                  '</li>'+
                  '<li>'+
                    '<a class="option" href="#">Satellite</a>'+
                  '</li>'+
                  '<li>'+
                    '<a class="option" href="#">Terrain</a>'+
                  '</li>'+
                  '<li>'+
                    '<a class="option" href="#">Roadmap</a>'+
                  '</li>'+                  
                  '<li>'+
                    '<a class="option" href="#">Custom tiles</a>'+
                    '<div class="suboptions">'+
                      '<label>Labels</label>'+
                      '<div class="long">'+
                        '<span class="radio" css="labels">'+
                          '<a href="#yes">YES</a>'+
                          '<a href="#no">NO</a>'+
                        '</span>'+
                      '</div>'+
                      '<label>Roads</label>'+
                      '<div class="long">'+
                        '<span class="radio" css="roads">'+
                          '<a href="#yes">YES</a>'+
                          '<a href="#no">NO</a>'+
                        '</span>'+
                      '</div>'+
                      '<label>Saturation</label>'+
                      '<div class="long">'+
                        '<span class="alpha" css="saturation">'+
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
                          '<span class="palette">'+
                            '<ul>'+
                              '<li><a href="#000000" style="background-color:#000000">black</a></li>'+
                              '<li><a href="#E2DADA" style="background-color:#E2DADA">grey</a></li>'+
                              '<li><a href="#E25B5B" style="background-color:#E25B5B">red</a></li>'+
                              '<li><a href="#FF9900" style="background-color:#FF9900">orange</a></li>'+
                              '<li><a href="#FFCC00" style="background-color:#FFCC00">yellow</a></li>'+
                              '<li><a href="#99CC00" style="background-color:#99CC00">green</a></li>'+
                              '<li><a href="#0099FF" style="background-color:#0099FF">blue</a></li>'+
                              '<li><a href="#FF3366" style="background-color:#FF3366">pink</a></li>'+
                            '</ul>'+
                          '</span>'+
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
                          '<span class="palette">'+
                            '<ul>'+
                              '<li><a href="#000000" style="background-color:#000000">black</a></li>'+
                              '<li><a href="#FFFFFF" style="background-color:#E2DADA">grey</a></li>'+
                              '<li><a href="#E25B5B" style="background-color:#E25B5B">red</a></li>'+
                              '<li><a href="#FF9900" style="background-color:#FF9900">orange</a></li>'+
                              '<li><a href="#FFCC00" style="background-color:#FFCC00">yellow</a></li>'+
                              '<li><a href="#99CC00" style="background-color:#99CC00">green</a></li>'+
                              '<li><a href="#0099FF" style="background-color:#0099FF">blue</a></li>'+
                              '<li><a href="#FF3366" style="background-color:#FF3366">pink</a></li>'+
                            '</ul>'+
                          '</span>'+
                          '<a href="#change_line_color" class="control" style="background-color:white"></a>'+
                          '<input type="text" value="#FFFFFF"/>'+
                        '</span>'+
                        '<span class="numeric" css="marker-line-width">'+
                          '<input disabled="disabled" class="range_value" type="text" value="3"/>'+
                          '<a href="#add_one_line_width" class="range_up" href="#range">+</a>'+
                          '<a href="#deduct_one_line_width" class="range_down" href="#range">-</a>'+
                        '</span>'+
                      '</div>'+
                      '<label>Transparency</label>'+
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
                          '<span class="palette">'+
                            '<ul>'+
                              '<li><a href="#000000" style="background-color:#000000">black</a></li>'+
                              '<li><a href="#FFFFFF" style="background-color:#E2DADA">grey</a></li>'+
                              '<li><a href="#E25B5B" style="background-color:#E25B5B">red</a></li>'+
                              '<li><a href="#FF9900" style="background-color:#FF9900">orange</a></li>'+
                              '<li><a href="#FFCC00" style="background-color:#FFCC00">yellow</a></li>'+
                              '<li><a href="#99CC00" style="background-color:#99CC00">green</a></li>'+
                              '<li><a href="#0099FF" style="background-color:#0099FF">blue</a></li>'+
                              '<li><a href="#FF3366" style="background-color:#FF3366">pink</a></li>'+
                            '</ul>'+
                          '</span>'+
                          '<a href="#change_fill_color" class="control"></a>'+
                          '<input type="text" value="#FF6600"/>'+
                        '</span>'+
                      '</div>'+
                      '<label>Border</label>'+
                      '<div class="long">'+
                        '<span class="color" css="line-color">'+
                          '<span class="palette">'+
                            '<ul>'+
                              '<li><a href="#000000" style="background-color:#000000">black</a></li>'+
                              '<li><a href="#E2DADA" style="background-color:#E2DADA">grey</a></li>'+
                              '<li><a href="#E25B5B" style="background-color:#E25B5B">red</a></li>'+
                              '<li><a href="#FF9900" style="background-color:#FF9900">orange</a></li>'+
                              '<li><a href="#FFCC00" style="background-color:#FFCC00">yellow</a></li>'+
                              '<li><a href="#99CC00" style="background-color:#99CC00">green</a></li>'+
                              '<li><a href="#0099FF" style="background-color:#0099FF">blue</a></li>'+
                              '<li><a href="#FF3366" style="background-color:#FF3366">pink</a></li>'+
                            '</ul>'+
                          '</span>'+
                          '<a href="#change_line_color" class="control"></a>'+
                          '<input type="text" value="#FFFFFF"/>'+
                        '</span>'+
                        '<span class="numeric" css="line-width">'+
                          '<input disabled="disabled" class="range_value" type="text" value="3"/>'+
                          '<a href="#add_one_line_width" class="range_up" href="#range">+</a>'+
                          '<a href="#deduct_one_line_width" class="range_down" href="#range">-</a>'+
                        '</span>'+
                      '</div>'+
                      '<label>Transparency</label>'+
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
                          '<span class="palette">'+
                            '<ul>'+
                              '<li><a href="#000000" style="background-color:#000000">black</a></li>'+
                              '<li><a href="#E2DADA" style="background-color:#E2DADA">grey</a></li>'+
                              '<li><a href="#E25B5B" style="background-color:#E25B5B">red</a></li>'+
                              '<li><a href="#FF9900" style="background-color:#FF9900">orange</a></li>'+
                              '<li><a href="#FFCC00" style="background-color:#FFCC00">yellow</a></li>'+
                              '<li><a href="#99CC00" style="background-color:#99CC00">green</a></li>'+
                              '<li><a href="#0099FF" style="background-color:#0099FF">blue</a></li>'+
                              '<li><a href="#FF3366" style="background-color:#FF3366">pink</a></li>'+
                            '</ul>'+
                          '</span>'+
                          '<a href="#change_fill_color" class="control"></a>'+
                          '<input type="text" value="#FF6600"/>'+
                        '</span>'+
                        '<span class="numeric" css="line-width">'+
                          '<input disabled="disabled" class="range_value" type="text" value="8"/>'+
                          '<a href="#add_one_line_width" class="range_up" href="#range">+</a>'+
                          '<a href="#deduct_one_line_width" class="range_down" href="#range">-</a>'+
                        '</span>'+
                      '</div>'+
                      '<label>Transparency</label>'+
                      '<div class="long">'+
                        '<span class="alpha" css="line-opacity">'+
                          '<div class="slider"></div>'+
                          '<span class="tooltip">83%</span>'+
                        '</span>'+
                      '</div>'+
                    '</div>'+
                  '</li>'+
                  '<li>'+
                    '<a class="option" href="#cartoCSS">CartoCSS</a>'+
                    '<div class="suboptions">'+
                      '<button type="button">Open CartoCSS</button>'+
                    '</di>'+
                  '</li>'+
                '</ul>'+
              '</div>'+
            '</li>'+
            '<li>'+
              '<h4>Infowindow customization</h4>'+
              '<p>Default</p>'+
              '<a class="open" href="#infowindow_customization"></a>'+
              '<div class="options">'+
                '<span class="tick"></span>'+
                '<ul class="infowindow_customization">'+
                  '<li>'+
                    '<a href="#default">Default</a>'+
                  '</li>'+
                  '<li>'+
                    '<a href="#custom">Custom</a>'+
                    '<div class="suboptions">'+
                      '<label>Custom vars</label>'+
                      '<ul class="column_names scrollPane">'+
                      '</ul>'+
                    '</div>'+
                  '</li>'+
                '</ul>'+
              '</div>'+
            '</li>'+
          '</ul>'+
        '</div>'+
        '<p class="georeferencing"></p>'+
        '<div id="map"></div>'+
        
        '<div class="cartocss_editor">'+
          '<a class="close" href="#close">close</a>'+
          '<div class="inner_">'+
            '<span class="top">'+
              '<h3>Edit your tiles</h3>'+
              '<p>This funcionality is in beta, and it doesn\'t show any error. If you want more information about CartoCSS, go <a target="_blank" href="http://developmentseed.org/blog/2011/feb/09/introducing-carto-css-map-styling-language/">here</a>.</p>'+
              '<textarea id="cartocss_editor"> </textarea>'+
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

    