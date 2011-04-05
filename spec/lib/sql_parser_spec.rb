# coding: UTF-8

require 'spec_helper'

describe CartoDB::SqlParser do
  it "should parse distance() function" do
    CartoDB::SqlParser.parse("SELECT *, distance(r.the_geom, 40.33, 22.10) as distance from restaurants r where type_of_food = 'indian' limit 10").should == 
      "SELECT *, st_distance_sphere(ST_Transform(r.the_geom,4326),ST_SetSRID(ST_Point(40.33,22.10),4326)) as distance from restaurants r where type_of_food = 'indian' limit 10"
    CartoDB::SqlParser.parse("SELECT *,distance(the_geom, -3, 21.10) from restaurants").should == 
      "SELECT *,st_distance_sphere(ST_Transform(the_geom,4326),ST_SetSRID(ST_Point(-3,21.10),4326)) from restaurants"
  end
  
  it "should parse latitude() and longitude() functions" do
    CartoDB::SqlParser.parse("SELECT latitude(r.the_geom) as latitude, longitude(r.the_geom) as longitude from restaurants where type_of_food = 'indian' limit 10").should == 
      "SELECT ST_Y(ST_Transform(r.the_geom,4326)) as latitude, ST_X(ST_Transform(r.the_geom,4326)) as longitude from restaurants where type_of_food = 'indian' limit 10"
    CartoDB::SqlParser.parse("SELECT latitude(the_geom) as latitude, longitude(the_geom) as longitude from restaurants where type_of_food = 'indian' limit 10").should == 
      "SELECT ST_Y(ST_Transform(the_geom,4326)) as latitude, ST_X(ST_Transform(the_geom,4326)) as longitude from restaurants where type_of_food = 'indian' limit 10"
  end
  
  it "should parse intersect() functions" do
    CartoDB::SqlParser.parse("select * from restaurants where intersects(40.33,22.10,the_geom) = true").should == 
      "select * from restaurants where ST_Intersects(ST_SetSRID(ST_Point(40.33,22.10),4326),the_geom) = true"
  end
  
  it "should parse queries that combine different functions" do
    CartoDB::SqlParser.parse("SELECT latitude(the_geom), longitude(r.the_geom) from restaurantes r order by distance(the_geom, 40.5, 30.3)").should ==
      "SELECT ST_Y(ST_Transform(the_geom,4326)), ST_X(ST_Transform(r.the_geom,4326)) from restaurantes r order by st_distance_sphere(ST_Transform(the_geom,4326),ST_SetSRID(ST_Point(40.5,30.3),4326))"
  end
  
  it "should parse queries containing geojson()" do
    CartoDB::SqlParser.parse("SELECT 1 as foo, geojson(the_geom) from restaurants r").should ==
      "SELECT 1 as foo, ST_AsGeoJSON(ST_Transform(the_geom,4326)) from restaurants r"
  end
  
  it "should parse queries containing kml()" do
    CartoDB::SqlParser.parse("SELECT 1 as foo, kml(the_geom) from restaurants r").should ==
      "SELECT 1 as foo, ST_AsKML(ST_Transform(the_geom,4326),6) from restaurants r"
  end  
  
  it "should parse queries containing svg()" do
    CartoDB::SqlParser.parse("SELECT 1 as foo, svg(the_geom) from restaurants r").should ==
      "SELECT 1 as foo, ST_AsSVG(ST_Transform(the_geom,4326),6) from restaurants r"
  end  
  
  it "should parse queries containing wkt()" do
    CartoDB::SqlParser.parse("SELECT 1 as foo, wkt(the_geom) from restaurants r").should ==
      "SELECT 1 as foo, ST_AsText(ST_Transform(the_geom,4326),6) from restaurants r"
  end  
  
  it "should parse queries containing geohash()" do
    CartoDB::SqlParser.parse("SELECT 1 as foo, geohash(the_geom) from restaurants r").should ==
      "SELECT 1 as foo, ST_GeoHash(ST_Transform(the_geom,4326),6) from restaurants r"
  end      
end
