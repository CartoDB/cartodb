
		window.view_elements = {
			general_options :
				'<div class="general_options table">'+
	        '<ul>'+
	          '<li class="all"><a class="sql" href="#open_sql">SQL</a></li>'+
	          '<li class="table"><a href="#add_row" class="add_row">Add row</a></li>'+
	          '<li class="table"><a href="#add_column" class="add_column">Add column</a></li>'+
	          '<li class="selected map"><a class="select">select</a></li>'+
	          '<li class="map disabled"><a class="add_point">add point</a></li>'+
	          '<li class="map disabled"><a class="add_polygon">add polygon</a></li>'+
	          '<li class="map disabled"><a class="add_polyline">add line</a></li>'+
	          '<li class="map disabled"><a class="select_area">select area</a></li>'+
	          '<li class="map"><a class="carto">Carto</a></li>'+
	          '<li class="map hidden edit"><a class="discard">discard</a></li>'+
	          '<li class="map hidden special edit"><a class="complete">complete</a></li>'+
	        '</ul>'+
	        '<div class="tooltip">'+
	          '<p>select</p>'+
	          '<span class="arrow"></span>'+
	        '</div>'+
	      '</div>',
	    sql_editor : //SQL Console
	      '<div class="sql_window">'+
	      	'<a href="#close_this_view" class="close">close this view</a>'+
					'<div class="inner">'+
	       		'<h3>Add your custom SQL query</h3>'+
						'<p>You can free move or close this window to watch the table. If you want to know more about PostGIS check out this <a href="http://www.postgis.org/docs/" target="_blank">reference</a>. Protip: Ctrl+RETURN for lauching your query</p>'+
		        '<div class="outer_textarea"><textarea id="sql_textarea"></textarea></div>'+
		        '<span class="bottom">'+
		          '<span class="errors"><p>Your query is not correct, try again with another ;)</p></span>'+
		          '<span><a href="#undo" class="undo"></a><a href="#redo" class="redo"></a></span>'+
		          '<a href="#apply" class="try_query">Apply query</a>'+
		          '<a href="#clear" class="clear_table">Clear view</a>'+
		        '</span>'+
					'</div>'+
	      '</div>',
	    geo_window :
	    	'<div class="georeference_window">'+
          '<a href="#close_window" class="close_geo"></a>'+
          '<div class="inner_">'+
            '<span class="loading">'+
               '<h5>We are georeferencing your columns...</h5>'+
               '<p>Just some seconds, ok?</p>'+
             '</span>'+
            '<span class="top">'+
              '<h3>Choose your geocoding method for this table</h3>'+
              '<p>Please select the columns for the lat/lon fields or choose/create an address column.</p>'+
							'<ul class="main_list">'+
								'<li class="first_list selected">'+
								  '<a class="first_ul" href="#lat_lng_column">This is a lat/lon column</a>'+
		              '<div class="georef_options">'+
		                '<div class="select longitude">'+
		                  '<label>LONGITUDE COLUMN</label>'+
		                  '<span class="select longitude">'+
		                    '<a id="longitude" class="option" href="#column_name" c="">Retrieving columns...</a>'+
		                    '<div class="select_content">'+
		                      '<ul class="scrollPane"></ul>'+
		                    '</div>'+
		                  '</span>'+
		                '</div>'+
				            '<div class="select latitude last">'+
		                  '<label>LATITUDE COLUMN</label>'+
		                  '<span class="select latitude">'+
		                    '<a id="latitude" class="option" href="#column_name" c="">Retrieving columns...</a>'+
		                    '<div class="select_content">'+
		                      '<ul class="scrollPane"></ul>'+
		                    '</div>'+
		                  '</span>'+
		                '</div>'+
		              '</div>'+
	              	'<div class="error_content"><p><span>You have to select latitude and longitude</span></p></div>'+
								'</li>'+
								'<li class="first_list">'+
									'<a class="first_ul" href="#choose_address">Choose or create an address column</a>'+
		              '<div class="georef_options">'+
										'<p class="hack"></p>'+
										'<p>Specify columns to use for geocoding by adding them within brackets.</p>'+
										'<input class="address_input" type="text" value=""/>'+
										'<span class="hint">HINT</span><p class="example">You can also add extra text to make it more accurate (eg. {school}, New York, USA )</p>'+
		              '</div>'+
								'</li>'+
							'</ul>'+
            '</span>'+
            '<span class="bottom">'+
              '<a href="#close_window" class="cancel">cancel</a>'+
              '<a href="#confirm_georeference" class="confirm_georeference">Georeference</a>'+
            '</span>'+
          '</div>'+
        '</div>'
		}