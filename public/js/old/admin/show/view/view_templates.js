
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
	          '<li class="map carto"><a class="carto">Carto</a></li>'+
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
						'<span class="top">'+
	       			'<h3>Add your custom SQL query</h3>'+
							'<p>You can free move or close this window to watch the table. If you want to know more about PostGIS check out this <a href="http://www.postgis.org/docs/" target="_blank">reference</a>. Protip: Alt+RETURN for lauching your query</p>'+
		        	'<div class="outer_textarea"><textarea id="sql_textarea"></textarea></div>'+
		        	'<span class="errors"><p>Your query is not correct, try again with another ;)</p></span>'+
						'</span>'+
		        '<span class="bottom">'+
		          '<span class="history">'+
		          	'<a href="#undo" class="undo"></a><a href="#redo" class="redo"></a>'+
		          	'<div class="tooltip">'+
	          			'<p>select</p>'+
	          			'<span class="arrow"></span>'+
	        			'</div>'+
		          '</span>'+
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
               '<p>We\'ll be quick!</p>'+
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
        '</div>',
      advanced_options : 
      	'<div class="save_window">'+
          '<a href="#close_window" class="close"></a>'+
          '<div class="inner_">'+
            '<span class="loading">'+
              '<h5>We are duplicating your table...</h5>'+
              '<p>We\'ll be quick!</p>'+
            '</span>'+
            '<span class="top">'+
              '<h3>Insert a name for your copy of this table</h3>'+
              '<input type="text"/>'+
              '<div class="error_content"><p><span>Provide a name for your new table</span></p></div>'+
            '</span>'+
            '<span class="bottom">'+
              '<a href="#close_window" class="cancel">cancel</a>'+
              '<a href="#save_table" class="table_save" >Save table</a>'+
            '</span>'+
          '</div>'+
        '</div>',
      subheader_right : 
      	'<span class="advanced_options">'+
	        '<a href="#close_advanced_options" class="advanced">advanced<span></span></a>'+
	        '<ul>'+
	          '<li class="disabled"><a class="import_data">Import data...</a></li>'+
	          '<li><a class="export_data">Export data...</a></li>'+
	          '<li><a class="save_table">Duplicate table as...</a></li>'+
	        '</ul>'+
	      '</span>',
	    privacy_window :	     	
	      '<span class="privacy_window">'+
	        '<ul>'+
	          '<li class="public '+((status=="public")?'selected':'')+'"><a href="#"><strong>Public</strong> (visible to others)</a></li>'+
	          '<li class="private '+((status=="private")?'selected':'')+'"><a href="#"><strong>Private</strong> (visible to you)</a></li>'+
	        '</ul>'+
	      '</span>',
	    delete_window :
	    	'<div class="delete_window">'+
          '<a href="#close_window" class="close"></a>'+
          '<div class="inner_">'+
            '<span class="top">'+
              '<h3>You are about to delete this table</h3>'+
              '<p>You will not be able to recover this information. We really recommend to <a class="export_data" href="#export_data">export the data</a> before deleting it.</p>'+
            '</span>'+
            '<span class="bottom">'+
              '<a href="#close_window" class="cancel">cancel</a>'+
              '<a href="#confirm_delete" class="confirm_delete">Delete this table</a>'+
            '</span>'+
          '</div>'+
        '</div>',
      export_window :
		    '<div class="export_window">'+
          '<a href="#close_window" class="close"></a>'+
          '<div class="inner_">'+
            '<form action="/tables/'+ table_name +'" method="get">'+
              '<input id="export_format" type="hidden" name="format" />'+
              '<span class="top">'+
                '<h3>Export your data</h3>'+
                '<p>Select your desired format for downloading the data</p>'+
                '<ul>'+
                  '<li class="selected"><a class="option" href="#CSV" rel="csv">CSV (Comma separated values)</a></li>'+
                  '<li><a class="option" href="#KML" rel="kml">KML</a></li>'+
                  '<li><a class="option" href="#SHP" rel="shp">SHP</a></li>'+
                  '<li><a class="option" href="#SQL" rel="sql">SQL</a></li>'+
                '</ul>'+
              '</span>'+
              '<span class="bottom">'+
                '<a href="#close_window" class="cancel">cancel</a>'+
                '<input type="submit" class="download" value="Download" />'+
              '</span>'+
          '</div>'+
        '</div>',
      title_window :
        '<span class="title_window">'+
          '<p>Pick a name for this table</p>'+
          '<form id="change_name" method="get" action="#"><input type="text" name="title"/>'+
          '<input type="submit" value="Save" name="submit"/></form>'+
          '<span>The name cannot be blank</span>'+
        '</span>',
      warning_window : 
        '<div class="warning_window">'+
        	'<a href="#close_window" class="close"></a>'+
          '<div class="inner_">'+
            '<form>'+
              '<span class="top">'+
                '<h3>This change will affect your API calls</h3>'+
                '<p>If you are accesing to this table via API don’t forget to update the name in the API calls after changing the name.</p>'+
              '</span>'+
              '<span class="bottom">'+
                '<a href="#close_window" class="cancel">cancel</a>'+
                '<input type="submit" class="continue" value="Ok, continue"/>'+
              '</span>'+
            '</form>'+
          '</div>'+
        '</div>',
      tags_window :
      	'<span class="tags_window">'+
	        '<ul id="tags_list"></ul>'+
	        '<a id="save_all_tags" href="#save_tags">Save</a>'+
	      '</span>',
      embed_window :
	      '<div class="embed_window">'+
          '<a href="#close_window" class="close"></a>'+
          '<div class="inner_">'+
            '<span class="top">'+
              '<h3>Share your CartoDB map</h3>'+
              '<p>It’s just copy and paste!</p>'+
              '<div class="tiles_code">'+
                '<h4>DIRECT LINK</h4>'+
                '<span class="copy_code">'+
                  '<p>'+ TILEHTTP +'://'+ user_name + '.' + TILESERVER +'/tables/'+table_name+'/embed_map</p>'+
                  '<a class="copy">Copy</a>'+
                '</span>'+
              '</div>'+
              
              '<div class="html_code">'+
                '<h4>OR HTML EMBED CODE</h4>'+
                '<span class="copy_code">'+
                  '<p>&#60iframe src=\''+ TILEHTTP +'://'+ user_name + '.' + TILESERVER +'/tables/'+table_name+'/embed_map\' width=\'572\' height=\'220\'&#62&#60/iframe&#62</p>'+
                  '<a id="test" class="copy">Copy</a>'+
                '</span>'+
                '<span class="outer_map">'+
                  '<div id="embed_map" class="embed_map"></div>'+
                  '<a href="#zoom_in" class="embed_zoom_in">+</a>'+
                  '<a href="#zoom_out" class="embed_zoom_out">-</a>'+
                  '<a href="http://cartodb.com" class="cartodb_logo" target="_blank">CartoDB</a>'+
                '</span>'+
              '</div>'+
            '</span>'+
            '<span class="bottom">'+
              '<a href="#close_window" class="cancel">Close</a>'+
            '</span>'+
          '</div>'+
        '</div>',
      stop_window :
        '<div class="stop_window">'+
          '<a href="#close_window" class="close"></a>'+
          '<div class="inner_">'+
            '<span class="stop">'+
              '<h5>Sorry, this geometry is too big to edit in browser</h5>'+
              '<p>We\'re working on ways to improve this, but in the meantime you can edit the geometry via our API.</p>'+
            '</span>'+
          '</div>'+
        '</div>',
      mapkey_window :
	      '<div class="mapkey_window">'+
          '<a href="#close_window" class="close"></a>'+
          '<div class="inner_">'+
            '<span class="top">'+
              '<h3>Your Map Key</h3>'+
              '<p>If your table is private, you will need this for being able to use this tiles out of CartoDB.</p>'+
              '<span class="copy_code">'+
                '<input type="text" disabled="disabled" value="'+ map_key +'" />'+
                '<a class="copy">Copy</a>'+
              '</span>'+
            '</span>'+
            '<span class="bottom">'+
              '<a href="#close_window" class="cancel">Close</a>'+
            '</span>'+
          '</div>'+
        '</div>'
		}