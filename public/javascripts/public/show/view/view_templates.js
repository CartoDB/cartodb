
		window.view_elements = {
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
        '</div>'
		}