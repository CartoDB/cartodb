   
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
            '</li>'+
            '<li>'+
              '<h4>Visualization type</h4>'+
              '<p>Features visualization</p>'+
            '</li>'+
            '<li>'+
              '<h4>Markers customization <a href="#" style="text-decoration:underline;" id="carto_css">css</a></h4>'+
              '<p>Customized dots</p>'+
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

    