--
-- Determine the Heads/Tails classifications from a numeric array
--
-- @param in_array A numeric array of numbers to determine the best
--            bins based on the Heads/Tails method.
--
-- @param breaks The number of bins you want to find.
--  
--

CREATE OR REPLACE FUNCTION CDB_HeadsTailsBins ( in_array NUMERIC[], breaks INT) RETURNS NUMERIC[] as $$ 
DECLARE 
    element_count INT4; 
    arr_mean numeric; 
    i INT := 2; 
    reply numeric[]; 
BEGIN 
    -- get the total size of our row
    element_count := array_upper(in_array, 1) - array_lower(in_array, 1); 
    -- ensure the ordering of in_array
    SELECT array_agg(e) INTO in_array FROM (SELECT unnest(in_array) e ORDER BY e) x;
    -- stop if no rows 
    IF element_count IS NULL THEN  
        RETURN NULL; 
    END IF; 
    -- stop if our breaks are more than our input array size
    IF element_count < breaks THEN  
        RETURN in_array; 
    END IF; 

    -- get our mean value
    SELECT avg(v) INTO arr_mean FROM (  SELECT unnest(in_array) as v ) x; 

    reply = Array[arr_mean];
    -- slice our bread
    LOOP  
        IF i > breaks THEN  EXIT;  END IF;  
        SELECT avg(e) INTO arr_mean FROM ( SELECT unnest(in_array) e) x WHERE e > reply[i-1];
        IF arr_mean IS NOT NULL THEN
            reply = array_append(reply, arr_mean);
        END IF;
        i := i+1; 
    END LOOP; 
    RETURN reply; 
END; 
$$ language plpgsql IMMUTABLE;