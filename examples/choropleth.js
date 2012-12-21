
  var choropleths = [
    {
      name:       "Average domestic consumption",
      data_column:"av_consumption_dom",
      sql:        "SELECT the_geom_webmercator,av_consumption_dom,cartodb_id FROM mlsoa_boundaries",
      cartocss:   "#mlsoa_boundaries{\
                    line-color: #FFF;\
                    line-opacity: 1;\
                    line-width: 0.1;\
                    polygon-opacity: 0.8;\
                  }\
                  #mlsoa_boundaries [ av_consumption_dom <= 7642] {\
                     polygon-fill: #91003F;\
                  }\
                  #mlsoa_boundaries [ av_consumption_dom <= 4457] {\
                     polygon-fill: #CE1256;\
                  }\
                  #mlsoa_boundaries [ av_consumption_dom <= 4035] {\
                     polygon-fill: #E7298A;\
                  }\
                  #mlsoa_boundaries [ av_consumption_dom <= 3809] {\
                     polygon-fill: #DF65B0;\
                  }\
                  #mlsoa_boundaries [ av_consumption_dom <= 3634] {\
                     polygon-fill: #C994C7;\
                  }\
                  #mlsoa_boundaries [ av_consumption_dom <= 3473] {\
                     polygon-fill: #D4B9DA;\
                  }\
                  #mlsoa_boundaries [ av_consumption_dom <= 3293] {\
                     polygon-fill: #F1EEF6;\
                  }"
      ,
      colors:     ['#F1EEF6', '#D4B9DA', '#C994C7', '#DF65B0', '#E7298A', '#CE1256', '#91003F'],
      max:        7642,
      min:        2394
    },
    {
      name:       "Total domestic consumtion",
      data_column:"consumption_dom",
      sql:        "SELECT the_geom_webmercator,consumption_dom,cartodb_id FROM mlsoa_boundaries",
      cartocss:   "#mlsoa_boundaries{\
                    line-color: #FFF;\
                    line-opacity: 1;\
                    line-width: 0.1;\
                    polygon-opacity: 0.8;\
                  }\
                  #mlsoa_boundaries [ consumption_dom <= 41748782] {\
                     polygon-fill: #005824;\
                  }\
                  #mlsoa_boundaries [ consumption_dom <= 13012002] {\
                     polygon-fill: #238B45;\
                  }\
                  #mlsoa_boundaries [ consumption_dom <= 11322590] {\
                     polygon-fill: #41AE76;\
                  }\
                  #mlsoa_boundaries [ consumption_dom <= 10144538] {\
                     polygon-fill: #66C2A4;\
                  }\
                  #mlsoa_boundaries [ consumption_dom <= 9136192] {\
                     polygon-fill: #CCECE6;\
                  }\
                  #mlsoa_boundaries [ consumption_dom <= 8157216] {\
                     polygon-fill: #D7FAF4;\
                  }\
                  #mlsoa_boundaries [ consumption_dom <= 6639890] {\
                     polygon-fill: #EDF8FB;\
                  }"
      ,
      colors:     ['#EDF8FB', '#D7FAF4', '#CCECE6', '#66C2A4', '#41AE76', '#238B45', '#005824'],
      max:        41748782,
      min:        58420
    }
  ]