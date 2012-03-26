--
-- Function to "safely" transform to webmercator
--
-- This function works around the existance of a valid range
-- for web mercator by "clipping" anything outside to the valid
-- range.
--
CREATE OR REPLACE FUNCTION CDB_TransformToWebmercator(geom geometry)
RETURNS geometry
AS
$$
 WITH

 -- This is the valid web mercator extent 
 --
 -- NOTE: some sources set the valid latitude range
 --       to -85.0511 to 85.0511 but as long as proj
 --       does not complain we are happy
 --
 valid_extent AS
 (
   SELECT
     ST_MakeEnvelope(-180, -89, 180, 89, 4326)
   AS ext
 ),

 -- Since we're going to use ST_Intersection on input
 -- we'd better ensure the input is valid
 valid_input AS
 (
   SELECT
     CASE
       -- See http://trac.osgeo.org/postgis/ticket/1719
       WHEN ST_Dimension($1) = 0 OR
            GeometryType($1) = 'GEOMETRYCOLLECTION'
       THEN
         $1
       ELSE
         ST_CollectionExtract(
           ST_MakeValid($1),
           ST_Dimension($1)+1
         )
     END as geom
 ),

 -- Then we transform to WGS84 latlon, which is
 -- where we have known coordinates for the clipping
 -- 
 latlon_input AS
 (
   SELECT ST_Transform(geom, 4326) AS geom
   FROM valid_input
 ),

 -- Then we clip, trying to retain the input type
 -- 
 clipped_input AS
 (
   -- TODO: clip to the envelope ?
   SELECT 
     CASE 
       WHEN GeometryType(geom) LIKE 'MULTI%'
       THEN
         ST_Multi(
           ST_Intersection(
             geom,
             ext
           )
         )
       ELSE
         ST_Intersection(
           geom,
           ext
         )
     END as geom 
   FROM latlon_input, valid_extent
 )

 -- And finally we transform to web mercator
 SELECT
 ST_Transform( geom, 3857)
 FROM clipped_input;

$$ LANGUAGE 'sql' IMMUTABLE STRICT;
