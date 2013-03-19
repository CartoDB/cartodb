# coding: UTF-8

require 'spec_helper'

# describe CartoDB::SqlParser do
#   it "should parse distance() function" do
#     CartoDB::SqlParser.parse("SELECT *, distance(r.the_geom, 40.33, 22.10) as distance from restaurants r where type_of_food = 'indian' limit 10").should == 
#       "SELECT *, st_distance_sphere(r.the_geom,ST_SetSRID(ST_Point(40.33,22.10),4326)) as distance from restaurants r where type_of_food = 'indian' limit 10"
#     CartoDB::SqlParser.parse("SELECT *,distance(the_geom, -3, 21.10) from restaurants").should == 
#       "SELECT *,st_distance_sphere(the_geom,ST_SetSRID(ST_Point(-3,21.10),4326)) from restaurants"
#   end
#   
#   it "should parse latitude() and longitude() functions" do
#     CartoDB::SqlParser.parse("SELECT latitude(r.the_geom) as latitude, longitude(r.the_geom) as longitude from restaurants where type_of_food = 'indian' limit 10").should == 
#       "SELECT ST_Y(r.the_geom) as latitude, ST_X(r.the_geom) as longitude from restaurants where type_of_food = 'indian' limit 10"
#     CartoDB::SqlParser.parse("SELECT latitude(the_geom) as latitude, longitude(the_geom) as longitude from restaurants where type_of_food = 'indian' limit 10").should == 
#       "SELECT ST_Y(the_geom) as latitude, ST_X(the_geom) as longitude from restaurants where type_of_food = 'indian' limit 10"
#   end
#   
#   it "should parse intersect() functions" do
#     CartoDB::SqlParser.parse("select * from restaurants where intersects(40.33,22.10,the_geom) = true").should == 
#       "select * from restaurants where ST_Intersects(ST_SetSRID(ST_Point(40.33,22.10),4326),the_geom) = true"
#   end
#   
#   it "should parse queries that combine different functions" do
#     CartoDB::SqlParser.parse("SELECT latitude(the_geom), longitude(r.the_geom) from restaurantes r order by distance(the_geom, 40.5, 30.3)").should ==
#       "SELECT ST_Y(the_geom), ST_X(r.the_geom) from restaurantes r order by st_distance_sphere(the_geom,ST_SetSRID(ST_Point(40.5,30.3),4326))"
#   end
#   
#   it "should parse queries containing geojson()" do
#     CartoDB::SqlParser.parse("SELECT 1 as foo, geojson(the_geom) from restaurants r").should ==
#       "SELECT 1 as foo, ST_AsGeoJSON(the_geom,8) from restaurants r"
#   end
#   
#   it "should parse queries containing kml()" do
#     CartoDB::SqlParser.parse("SELECT 1 as foo, kml(the_geom) from restaurants r").should ==
#       "SELECT 1 as foo, ST_AsKML(the_geom,6) from restaurants r"
#   end  
#   
#   it "should parse queries containing svg()" do
#     CartoDB::SqlParser.parse("SELECT 1 as foo, svg(the_geom) from restaurants r").should ==
#       "SELECT 1 as foo, ST_AsSVG(the_geom,0,6) from restaurants r"
#   end  
#   
#   it "should parse queries containing wkt()" do
#     CartoDB::SqlParser.parse("SELECT 1 as foo, wkt(the_geom) from restaurants r").should ==
#       "SELECT 1 as foo, ST_AsText(the_geom) from restaurants r"
#   end  
#   
#   it "should parse queries containing geohash()" do
#     CartoDB::SqlParser.parse("SELECT 1 as foo, geohash(the_geom) from restaurants r").should ==
#       "SELECT 1 as foo, ST_GeoHash(the_geom,6) from restaurants r"
#   end
#   
#   it "should convert any the_geom reference, including a * into a ST_AsGeoJSON(the_geom)" do
#     CartoDB::SqlParser.parse("select the_geom from table").should == "select ST_AsGeoJSON(the_geom) as the_geom from table"
#     CartoDB::SqlParser.parse("select cartodb_id, the_geom from wadus").should == "select cartodb_id,ST_AsGeoJSON(the_geom) as the_geom from wadus"
#     CartoDB::SqlParser.parse("select a,b,the_geom from table").should == "select a,b,ST_AsGeoJSON(the_geom) as the_geom from table"
#     CartoDB::SqlParser.parse("select ST_X(the_geom) from table").should == "select ST_X(the_geom) from table"
#     CartoDB::SqlParser.parse("select ST_X(   the_geom  ) from table").should == "select ST_X(   the_geom  ) from table"
#     CartoDB::SqlParser.parse("select the_geom, other_column from table").should == "select ST_AsGeoJSON(the_geom) as the_geom, other_column from table"
#     CartoDB::SqlParser.parse("select other_column, the_geom from table").should == "select other_column,ST_AsGeoJSON(the_geom) as the_geom from table"
#   end
#   
#   it "should expand * to a list of columns" do
#     user = create_user
#     table = new_table
#     table.user_id = user.id
#     table.name = 'table1'
#     table.save
#     
#     CartoDB::SqlParser.parse("select * from table1", user.database_name).should == "select cartodb_id,name,description,ST_AsGeoJSON(the_geom) as the_geom,created_at,updated_at from table1"
#     CartoDB::SqlParser.parse("select * from table1 where intersects(40.33,22.10,the_geom) = true", user.database_name).should == 
#       "select cartodb_id,name,description,ST_AsGeoJSON(the_geom) as the_geom,created_at,updated_at from table1 where ST_Intersects(ST_SetSRID(ST_Point(40.33,22.10),4326),the_geom) = true"
#   end
#   
#   it "should expand table_name.* to a list of columns" do
#     user = create_user
#     table1 = new_table
#     table1.user_id = user.id
#     table1.name = 'table1'
#     table1.save
#     
#     table2 = new_table
#     table2.user_id = user.id
#     table2.name = 'table2'
#     table2.save
#     
#     CartoDB::SqlParser.parse("select table2.*,table1.cartodb_id from table1,table2", user.database_name).should == 
#       "select table2.cartodb_id,table2.name,table2.description,ST_AsGeoJSON(table2.the_geom) as the_geom,table2.created_at,table2.updated_at,table1.cartodb_id from table1,table2"
#   end
# 
#   it "should expand table1.*,table2.* to a list of columns" do
#     user = create_user
#     table1 = new_table
#     table1.user_id = user.id
#     table1.name = 'table1'
#     table1.save
#     
#     table2 = new_table
#     table2.user_id = user.id
#     table2.name = 'table2'
#     table2.save
#     
#     CartoDB::SqlParser.parse("select table1.*,table2.* from table1,table2", user.database_name).should == 
#       "select table1.cartodb_id,table1.name,table1.description,ST_AsGeoJSON(table1.the_geom) as the_geom,table1.created_at,table1.updated_at,table2.cartodb_id,table2.name,table2.description,ST_AsGeoJSON(table2.the_geom) as the_geom,table2.created_at,table2.updated_at from table1,table2"
#   end
#   
#   it "should parse the_geom when included in a function" do
#     CartoDB::SqlParser.parse("select geojson(ST_Union(the_geom)) as the_geom from cp_vizzuality WHERE cod_postal in ('01001','01002')").should == 
#       "select ST_AsGeoJSON(ST_Union(the_geom),6) as the_geom from cp_vizzuality WHERE cod_postal in ('01001','01002')"
#   end
#   
#   it "should parse a query with subqueries" do
#     CartoDB::SqlParser.parse("SELECT id_4 AS id,name_4 AS municipio,name_2 AS provincia,censo_total,((votantes_totales::NUMERIC / censo_total::NUMERIC) * 100)::INTEGER AS percen_participacion,primer_partido_percent,pp1.name AS primer_partido_name,segundo_partido_per
#     cent,pp2.name AS segundo_partido_name,tercer_partido_percent,pp3.name AS tercer_partido_name,0 AS otros_partido_percent,center_longitude,center_latitude,vsm.paro_normalizado_1996,vsm.paro_normalizado_1997,vsm.paro_normalizado_1998,vsm.paro_normalizado_1999,vsm.paro_normalizado_2000,vsm.paro_normalizado_2001,vsm.pa
#     ro_normalizado_2002,vsm.paro_normalizado_2003,vsm.paro_normalizado_2004,vsm.paro_normalizado_2005,vsm.paro_normalizado_2006,vsm.paro_normalizado_2007,vsm.paro_normalizado_2008,vsm.paro_normalizado_2009,p_n_min_max.* FROM (SELECT max(paro_normalizado_1996) as paro_normalizado_1996_max,min(paro_normalizado_1996) as 
#     paro_normalizado_1996_min, max(paro_normalizado_1997) as paro_normalizado_1997_max,min(paro_normalizado_1997) as paro_normalizado_1997_min,max(paro_normalizado_1998) as paro_normalizado_1998_max,min(paro_normalizado_1998) as paro_normalizado_1998_min,max(paro_normalizado_1999) as paro_normalizado_1999_max,min(paro
#     _normalizado_1999) as paro_normalizado_1999_min,max(paro_normalizado_2000) as paro_normalizado_2000_max,min(paro_normalizado_2000) as paro_normalizado_2000_min,max(paro_normalizado_2001) as paro_normalizado_2001_max,min(paro_normalizado_2001) as paro_normalizado_2001_min,max(paro_normalizado_2002) as paro_normaliz
#     ado_2002_max,min(paro_normalizado_2002) as paro_normalizado_2002_min,max(paro_normalizado_2003) as paro_normalizado_2003_max,min(paro_normalizado_2003) as paro_normalizado_2003_min,max(paro_normalizado_2004) as paro_normalizado_2004_max,min(paro_normalizado_2004) as paro_normalizado_2004_min,max(paro_normalizado_2
#     005) as paro_normalizado_2005_max,min(paro_normalizado_2005) as paro_normalizado_2005_min,max(paro_normalizado_2006) as paro_normalizado_2006_max,min(paro_normalizado_2006) as paro_normalizado_2006_min,max(paro_normalizado_2007) as paro_normalizado_2007_max,min(paro_normalizado_2007) as paro_normalizado_2007_min,m
#     ax(paro_normalizado_2008) as paro_normalizado_2008_max,min(paro_normalizado_2008) as paro_normalizado_2008_min,max(paro_normalizado_2009) as paro_normalizado_2009_max,min(paro_normalizado_2009) as paro_normalizado_2009_min FROM vars_socioeco_x_municipio) AS p_n_min_max,gadm4 AS g INNER JOIN votaciones_por_municipi
#     o AS v ON g.cartodb_id = v.gadm4_cartodb_id INNER JOIN vars_socioeco_x_municipio AS vsm ON vsm.gadm4_cartodb_id = v.gadm4_cartodb_id INNER JOIN partidos_politicos AS pp1 ON pp1.cartodb_id = v.primer_partido_id INNER JOIN partidos_politicos AS pp2 ON pp2.cartodb_id = v.segundo_partido_id INNER JOIN partidos_politic
#     os AS pp3 ON pp3.cartodb_id = v.tercer_partido_id WHERE v_get_tile(1014,757,11) && centre_geom_webmercator and proceso_electoral_id=73")
#   end
#   
# end
