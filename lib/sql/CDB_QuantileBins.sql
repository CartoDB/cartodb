--
-- Determine the Quantile classifications from a numeric array
--
-- @param in_array A numeric array of numbers to determine the best
--            bins based on the Quantile method.
--
-- @param breaks The number of bins you want to find.
--  
--
CREATE OR REPLACE FUNCTION CDB_QuantileBins ( in_array NUMERIC[], breaks INT) RETURNS NUMERIC[] as $$ 
DECLARE 
    element_count INT4; 
    break_size numeric;
    tmp_val numeric; 
    i INT := 1; 
    reply numeric[]; 
BEGIN 
    -- get our unique values
    SELECT array_agg(e) INTO in_array FROM (SELECT unnest(in_array) e GROUP BY e ORDER BY e ASC) x;
    -- get the total size of our row
    element_count := array_upper(in_array, 1) - array_lower(in_array, 1); 
    break_size :=  element_count::numeric / breaks;
    -- slice our bread
    LOOP  
        IF i > breaks THEN  EXIT;  END IF;  
        SELECT e INTO tmp_val FROM ( SELECT unnest(in_array) e LIMIT 1 OFFSET round(break_size * i)) x;
        reply = array_append(reply, tmp_val);
        i := i+1; 
    END LOOP; 
    RETURN reply; 
END; 
$$ language plpgsql IMMUTABLE;