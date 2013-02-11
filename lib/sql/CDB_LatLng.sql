CREATE OR REPLACE FUNCTION CDB_LatLng (lat NUMERIC, lng NUMERIC) RETURNS geometry as $$ 
BEGIN 
    -- this function is silly
    RETURN ST_SetSRID(ST_MakePoint(lng,lat),4326); 
END; 
$$ language plpgsql IMMUTABLE;

