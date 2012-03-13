   
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
	                  '<a class="option" href="#roadmap">Roadmap</a>'+
	                '</li>'+
                  '<li>'+
                    '<a class="option" href="#satellite">Satellite</a>'+
                  '</li>'+
                  '<li>'+
                    '<a class="option" href="#terrain">Terrain</a>'+
                  '</li>'+
                  '<li>'+
                    '<a class="option" href="#custom">Custom tiles</a>'+
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
              '<a class="open" href="#visualization_type"></a>'+
              '<div class="options mlong">'+
                '<span class="tick"></span>'+
                '<ul class="visualization_type">'+
                  '<li>'+
                    '<a class="option" href="#features">Features</a>'+
                    '<div class="suboptions points">'+
                      '<label>Fill</label>'+
                      '<div class="long">'+
                        '<span class="color" css="marker-fill" default="#FF6600"></span>'+
                        '<span class="numeric" css="marker-width" default="5"></span>'+
                      '</div>'+
                      '<label>Border</label>'+
                      '<div class="long">'+
                        '<span class="color" css="marker-line-color" default="#FFFFFF"></span>'+
                        '<span class="numeric" css="marker-line-width" default="1"></span>'+
                      '</div>'+
                      '<label>Opacity</label>'+
                      '<div class="long">'+
                        '<span class="alpha" css="marker-opacity marker-line-opacity" default="1"></span>'+
                      '</div>'+
                    '</div>'+
                    '<div class="suboptions polygons">'+
                      '<label>Fill</label>'+
                      '<div class="long">'+
                        '<span class="color" css="polygon-fill" default="#FF6600"></span>'+
                      '</div>'+
                      '<label>Border</label>'+
                      '<div class="long">'+
                        '<span class="color" css="line-color" default="#FFFFFF"></span>'+
                        '<span class="numeric" css="line-width" default="1"></span>'+
                      '</div>'+
                      '<label>Opacity</label>'+
                      '<div class="long">'+
                        '<span class="alpha" css="polygon-opacity line-opacity" default="1"></span>'+
                      '</div>'+
                    '</div>'+
                    '<div class="suboptions lines">'+
                      '<label>Line</label>'+
                      '<div class="long">'+
                        '<span class="color" css="line-color" default="#FF6600"></span>'+
                        '<span class="numeric" css="line-width" default="1"></span>'+
                      '</div>'+
                      '<label>Opacity</label>'+
                      '<div class="long">'+
                        '<span class="alpha" css="line-opacity" default="1"></span>'+
                      '</div>'+
                    '</div>'+
                  '</li>'+
                  '<li>'+
                    '<a class="option" href="#bubbles">Bubble map</a>'+
                    '<div class="suboptions bubbles">'+
                      '<label>Column</label>'+
                      '<div class="long">'+
                        '<span class="dropdown" data="column" default="cartodb_id"></span>'+
                      '</div>'+
                      '<label>Fill</label>'+
                      '<div class="long">'+
                        '<span class="color" css="marker-fill" default="#FF6600"></span>'+
                      '</div>'+
                      '<label>Border</label>'+
                      '<div class="long">'+
                        '<span class="color" css="marker-line-color" default="#FFFFFF"></span>'+
                        '<span class="numeric" css="marker-line-width" default="1"></span>'+
                      '</div>'+
                      '<label>Opacity</label>'+
                      '<div class="long">'+
                        '<span class="alpha" css="marker-opacity marker-line-opacity" default="1"></span>'+
                      '</div>'+
                      '<label>Bubble sizes</label>'+
                      '<div class="long">'+
                        '<span class="numeric min" data="values" default="4"></span>'+
                        '<span class="numeric max" data="values" default="100"></span>'+
                      '</div>'+
                    '</div>'+
                  '</li>'+
                  '<li>'+
                    '<a class="option" href="#choropleth">Numeric Choropleth</a>'+
                    '<div class="suboptions choropleth">'+
                      '<label>Column</label>'+
                      '<div class="long">'+
                        '<span class="dropdown" data="column" default="cartodb_id"></span>'+
                      '</div>'+
                      '<label>Color divisions</label>'+
                      '<div class="long">'+
                        '<span class="dropdown buckets" data="values" default="5"></span>'+
                      '</div>'+
                      '<label>Color ramp</label>'+
                      '<div class="long">'+
                        '<span class="color_ramp" data="values"></span>'+
                      '</div>'+
                      '<label>Border</label>'+
                      '<div class="long">'+
                        '<span class="color" css="line-color" default="#FFFFFF"></span>'+
                        '<span class="numeric" css="line-width" default="1"></span>'+
                      '</div>'+
                      '<label>Opacity</label>'+
                      '<div class="long">'+
                        '<span class="alpha" css="line-opacity polygon-opacity" default="1"></span>'+
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
              '<div class="options">'+
                '<span class="tick"></span>'+
                '<ul class="infowindow_customization">'+
                  '<li>'+
                    '<a href="#default">Default</a>'+
                  '</li>'+
                  '<li>'+
                    '<a href="#custom">Custom</a>'+
                    '<div class="suboptions">'+
											'<span class="info_tools"><a class="mark_all" href="#mark_all">mark all</a><a class="clear_all" href="#clear_all">clear all</a></span>'+
                      '<ul class="column_names scrollPane"></ul>'+
                    '</div>'+
                  '</li>'+
                '</ul>'+
              '</div>'+
            '</li>'+
          '</ul>'+
        '</div>'+
        '<p class="georeferencing"></p>'+
        '<div id="map"></div>'
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
				'<form class="map_search">'+
					'<p>go to</p>'+
					'<input type="text" value="">'+
					'<input type="submit">'+
					'<span class="error">Ooops! Looks like we can\'t find this address</span>'+
				'</form>'
      );


      //////////////////////////////////////
      // Tiles Carto Editor								//
      //////////////////////////////////////
      $('body').append(
	      '<div class="cartocss_editor">'+
	          '<a class="close" href="#close">close</a>'+
	          '<div class="inner_">'+
	            '<span class="top">'+
	              '<h3>Edit your tiles</h3>'+
	              '<p>Check the <a target="_blank" href="http://mapbox.com/carto/">Carto documentation</a> to learn more.</p>'+
	              '<div class="outer_textarea"><textarea id="cartocss_editor" wrap="hard"></textarea></div>'+
								'<span class="errors"><div><p>Your query is not correct, try again with another ;)</p></div></span>'+
	            '</span>'+
	            '<span class="bottom">'+
	              '<span class="history">'+
	                '<a href="#undo" class="undo"></a><a href="#redo" class="redo"></a>'+
	                '<div class="tooltip">'+
	                  '<p>select</p>'+
	                  '<span class="arrow"></span>'+
	                '</div>'+
	              '</span>'+
	              '<a href="#try" class="try_css">Try style</a>'+
	            '</span>'+
	          '</div>'+
	        '</div>'
	    );
    }

    