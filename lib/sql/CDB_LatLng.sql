--
-- Create a valid GEOMETRY in 4326 from a lat/lng pair
--
-- @param lat A numeric latitude value.
--
-- @param lng A numeric longitude value.
--  
--

CREATE OR REPLACE FUNCTION CDB_LatLng (lat NUMERIC, lng NUMERIC) RETURNS geometry as $$ 
BEGIN 
    -- this function is silly
    RETURN ST_SetSRID(ST_MakePoint(lng,lat),4326); 
END; 
$$ language plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION CDB_LatLng (lat FLOAT8, lng FLOAT8) RETURNS geometry as $$ 
BEGIN 
    -- this function is silly
    RETURN ST_SetSRID(ST_MakePoint(lng,lat),4326); 
END; 
$$ language plpgsql IMMUTABLE;

