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


CREATE OR REPLACE FUNCTION CDB_DecimalDegreeLiteral(deg TEXT) RETURNS numeric as $$ 
BEGIN 
	-- Check if comma decimal place
	-- e.g. '141,00' = 141.00
	IF array_length(string_to_array(deg, ','), 1) > 1 THEN
		RETURN replace(deg, ',', '.')::numeric;
	-- Just try the good old convert to numeric
	ELSE
		RETURN deg::numeric;
	END IF;
END; 
$$ language plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION CDB_LatLng(lat TEXT, lng TEXT) RETURNS geometry as $$ 
BEGIN 
	-- TODO: Check if other text type. E.g. DDMMSS
    RETURN CDB_LatLng(
    	CDB_DecimalDegreeLiteral(lat), 
    	CDB_DecimalDegreeLiteral(lng)
    ); 
END; 
$$ language plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION CDB_LatLng(coords TEXT) RETURNS geometry as $$ 
DECLARE
BEGIN 
	-- TODO: Check if other spaces. E.g. DD MM SS
    RETURN CDB_LatLng(
    	CDB_DecimalDegreeLiteral(split_part(coords, ' ', 1)), 
    	CDB_DecimalDegreeLiteral(split_part(coords, ' ', 2))
    ); 
END; 
$$ language plpgsql IMMUTABLE;