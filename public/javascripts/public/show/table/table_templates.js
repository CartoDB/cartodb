
      // THEAD COLUMN
      
      /* th */
      var th = '<th c="{{name}}" type="{{type}}">'+
                  '<div {{#cartodb_id}}style="width:75px"{{/cartodb_id}}  {{^cartodb_id}}style="width:{{cellsize}}px"{{/cartodb_id}}>'+
                    '<span class="long">'+
                      '<h3 {{^allowed}}class="static"{{/allowed}}>{{name}}</h3>'+
                      '{{#geo}}<p class="geo {{value}} {{#loading}}loading{{/loading}}">geo</p>{{/geo}}'+
                      '{{#allowed}}<input type="text" value="{{name}}"/>{{/allowed}}'+
                    '</span>'+
                    '<p class="long">'+
                      '<a {{#allowed}}href="#choose_type"{{/allowed}} class="{{^allowed}}static{{/allowed}} {{#allowed}}column_type{{/allowed}}">{{type}}</a>' +
                    '</p>'+
                    '<a class="options" href="#options">options</a>'+
                    // Column option list
                    '<span class="col_ops_list">' +
                      '<h5>ORDER</h5>' +
                      '<ul>' +
                        '<li><a class="order_asc">Order by ASC</a></li>' +
                        '<li><a class="order_desc">Order by DESC</a></li>' +
                      '</ul>' +
                      '<div class="line"></div>'+
                      '{{#allowed}}' +
                        '<h5>EDIT</h5>'+
                        '<ul>' +
                          '<li><a class="rename_column" href="#rename_column">Rename column</a></li>' +
                          '<li><a class="change_data_type" href="#change_data_type">Change data type</a></li>' +
                          '<li><a class="delete_column" href="#delete_column">Delete column</a></li>' +
                        '</ul>' +
                        '<div class="line geo_line"></div>' +
                        '<h5>GEOREFERENCE</h5>' +
                        '<ul class="geo_list">' +
                          '<li class="{{^geo_allow}}disabled{{/geo_allow}}"><a href="#" class="open_georeference">Georeference with...</a></li>' +
                        '</ul>' +
                        '<div class="line"></div>'+
                      '{{/allowed}}'+
                      '<h5>FILTER</h5>' +
                      '<ul>' +
                        '<li><a href="#filter_by_column" class="filter_column">Filter by this column</a></li>' + //filter_column
                      '</ul>' +
                      '<div class="line"></div>'+
                      '<h5>CREATE</h5>' +
                      '<ul>' +
                        '<li class="last"><a href="#add_column" class="add_column">Add new column</a></li>' +
                      '</ul>' +
                    '</span>'+
                    // Column types
                    '{{#allowed}}' +
                    '<span class="col_types">' +
                      '<p>{{type}}</p>' +
                      '<ul>' +
                        '<li><a href="#String">String</a></li>' +
                        '<li><a href="#Number">Number</a></li>' +
                        '<li><a href="#Date">Date</a></li>' +
                        '<li><a href="#Boolean">Boolean</a></li>' +
                      '</ul>' +
                    '</span>' +
                    '{{/allowed}}'+
                  '</div>'+
                '</th>';
                
      /* td */
      var first_td =  '<tr r="{{cartodb_id}}" class="{{^cartodb_id}}new{{/cartodb_id}}">'+
                        '<td class="first" r="{{cartodb_id}}">'+
                          '<div>' +
                            '<a href="#options" class="options">options</a>'+
                            '<span>' +
                              '<h5>EDIT</h5>' +
                              '<ul>' +
                                '<li class="disabled"><a>Duplicate row(s)</a></li>' +
                                '<li><a class="delete_row" href="#delete_row">Delete row(s)</a></li>' +
                              '</ul>' +
                              '<div class="line"></div>'+
                              '<h5>CREATE</h5>' +
                              '<ul>' +
                                '<li class="last"><a href="#add_row" class="add_row">Add new row</a></li>' +
                              '</ul>' +
                            '</span>'
                          '</div>'
                        '</td>';
      var generic_td =  '<td {{#allowed}}class="special"{{/allowed}} r="{{cartodb_id}}" c="{{column}}">'+
                          '<div class="{{^geojson}}italic{{/geojson}}" title="{{value}}" {{^is_cartodb_id}}style="width:{{cellsize}}px"{{/is_cartodb_id}}>{{value}}</div>'+
                        '</td>';