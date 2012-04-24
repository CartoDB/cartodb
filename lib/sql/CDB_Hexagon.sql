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

-- Return an hexagon grid covering given extent 
--
-- TODO: use snapping to ensure full coverage!
-- 
CREATE OR REPLACE FUNCTION CDB_HexagonGrid(ext GEOMETRY, side FLOAT8)
RETURNS SETOF GEOMETRY
AS $$
DECLARE
  h GEOMETRY; -- hexagon
  c GEOMETRY; -- center point
  rec RECORD;
  min_diameter FLOAT8;
  max_diameter FLOAT8;
  hstep FLOAT8; -- horizontal step
  vstep FLOAT8; -- vertical step
  vstart FLOAT8[];
  vstartidx INTEGER;
BEGIN

  max_diameter := side;
  min_diameter := sqrt(3)*side;
  hstep := side * 3.0/2.0;
  vstep := min_diameter;
  vstart := ARRAY[ ST_Ymin(ext) + (vstep/2.0), ST_Ymin(ext) ];
  vstartidx := 0;

  RAISE DEBUG 'Side: %', side;
  RAISE DEBUG 'min_diameter: %', min_diameter;
  RAISE DEBUG 'vstep: %', vstep;

  c := ST_MakePoint(ST_XMin(ext), vstart[vstartidx+1]);
  vstartidx := (vstartidx + 1) % 2;
  LOOP -- over X
    --RAISE DEBUG 'X loop starts, center point: %', ST_AsText(c);
    LOOP -- over Y
      h := CDB_MakeHexagon(c, side);
      RETURN NEXT h;
      c := ST_Translate(c, 0, vstep);
      --RAISE DEBUG 'Center: %', ST_AsText(c);
      IF c |>> ext THEN
        EXIT;
      END IF;
    END LOOP;
    c := ST_MakePoint(ST_X(c)+hstep, vstart[vstartidx+1]);
    vstartidx := (vstartidx + 1) % 2;
    IF c >> ext THEN
        EXIT;
    END IF;
  END LOOP;

  RETURN;
END
$$ LANGUAGE 'plpgsql' IMMUTABLE STRICT;
