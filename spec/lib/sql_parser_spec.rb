# coding: UTF-8

require 'spec_helper'

describe CartoDB::SqlParser do
  it "should parse distance() function" do
    CartoDB::SqlParser.parse("SELECT *, distance(r.the_geom, 40.33, 22.10) as distance from restaurants r where type_of_food = 'indian' limit 10").should == 
      "SELECT *, st_distance_sphere(r.the_geom,ST_SetSRID(ST_Point(40.33,22.10),4326)) as distance from restaurants r where type_of_food = 'indian' limit 10"
    CartoDB::SqlParser.parse("SELECT *,distance(the_geom, -3, 21.10) from restaurants").should == 
      "SELECT *,st_distance_sphere(the_geom,ST_SetSRID(ST_Point(-3,21.10),4326)) from restaurants"
  end
  
  it "should parse latitude() and longitude() functions" do
    CartoDB::SqlParser.parse("SELECT latitude(r.the_geom) as latitude, longitude(r.the_geom) as longitude from restaurants where type_of_food = 'indian' limit 10").should == 
      "SELECT ST_Y(r.the_geom) as latitude, ST_X(r.the_geom) as longitude from restaurants where type_of_food = 'indian' limit 10"
    CartoDB::SqlParser.parse("SELECT latitude(the_geom) as latitude, longitude(the_geom) as longitude from restaurants where type_of_food = 'indian' limit 10").should == 
      "SELECT ST_Y(the_geom) as latitude, ST_X(the_geom) as longitude from restaurants where type_of_food = 'indian' limit 10"
  end
  
  it "should parse intersect() functions" do
    CartoDB::SqlParser.parse("select * from restaurants where intersects(40.33,22.10,the_geom) = true").should == 
      "select * from restaurants where ST_Intersects(ST_SetSRID(ST_Point(40.33,22.10),4326),the_geom) = true"
  end
  
  it "should parse queries that combine different functions" do
    CartoDB::SqlParser.parse("SELECT latitude(the_geom), longitude(r.the_geom) from restaurantes r order by distance(the_geom, 40.5, 30.3)").should ==
      "SELECT ST_Y(the_geom), ST_X(r.the_geom) from restaurantes r order by st_distance_sphere(the_geom,ST_SetSRID(ST_Point(40.5,30.3),4326))"
  end
  
  it "should parse queries containing geojson()" do
    CartoDB::SqlParser.parse("SELECT 1 as foo, geojson(the_geom) from restaurants r").should ==
      "SELECT 1 as foo, ST_AsGeoJSON(the_geom) from restaurants r"
  end
  
  it "should parse queries containing kml()" do
    CartoDB::SqlParser.parse("SELECT 1 as foo, kml(the_geom) from restaurants r").should ==
      "SELECT 1 as foo, ST_AsKML(the_geom,6) from restaurants r"
  end  
  
  it "should parse queries containing svg()" do
    CartoDB::SqlParser.parse("SELECT 1 as foo, svg(the_geom) from restaurants r").should ==
      "SELECT 1 as foo, ST_AsSVG(the_geom,6) from restaurants r"
  end  
  
  it "should parse queries containing wkt()" do
    CartoDB::SqlParser.parse("SELECT 1 as foo, wkt(the_geom) from restaurants r").should ==
      "SELECT 1 as foo, ST_AsText(the_geom,6) from restaurants r"
  end  
  
  it "should parse queries containing geohash()" do
    CartoDB::SqlParser.parse("SELECT 1 as foo, geohash(the_geom) from restaurants r").should ==
      "SELECT 1 as foo, ST_GeoHash(the_geom,6) from restaurants r"
  end
  
  it "should convert any the_geom reference, including a * into a ST_AsGeoJSON(the_geom)" do
    CartoDB::SqlParser.parse("select the_geom from table").should == "select ST_AsGeoJSON(the_geom) from table"
    CartoDB::SqlParser.parse("select a,b,the_geom from table").should == "select a,b,ST_AsGeoJSON(the_geom) from table"
    CartoDB::SqlParser.parse("select ST_X(the_geom) from table").should == "select ST_X(the_geom) from table"
    CartoDB::SqlParser.parse("select ST_X(   the_geom  ) from table").should == "select ST_X(   the_geom  ) from table"
    CartoDB::SqlParser.parse("select the_geom, other_column from table").should == "select ST_AsGeoJSON(the_geom), other_column from table"
    CartoDB::SqlParser.parse("select other_column, the_geom from table").should == "select other_column,ST_AsGeoJSON(the_geom) from table"
  end
  
end
