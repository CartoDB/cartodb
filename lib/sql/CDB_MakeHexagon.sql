-- Return an Hexagon with given center and side (or maximal radius)
CREATE OR REPLACE FUNCTION CDB_MakeHexagon(center GEOMETRY, radius FLOAT8)
RETURNS GEOMETRY
AS $$
  SELECT ST_MakePolygon(ST_MakeLine(geom))
    FROM
    (
      SELECT (ST_DumpPoints(ST_ExteriorRing(ST_Buffer($1, $2, 3)))).*
    ) as points
    WHERE path[1] % 2 != 0
$$ LANGUAGE 'sql' IMMUTABLE STRICT;
