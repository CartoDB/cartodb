CREATE OR REPLACE FUNCTION CDB_JenksBins ( in_array NUMERIC[], breaks INT, invert BOOLEAN DEFAULT FALSE) RETURNS NUMERIC[] as $$ 
DECLARE 
    element_count INT4; 
    tmp_val numeric; 
    arr_mean numeric; 
    classes int[][];
    new_classes int[][];
    tmp_class int[];
    i INT := 1; 
    side INT := 2;
    bot INT;
    top INT;
    sdam numeric; 
    gvf numeric := 0.0; 
    new_gvf numeric; 
    arr_gvf numeric[]; 
    class_avg numeric; 
    class_max_i INT; 
    class_min_i INT; 
    class_max numeric; 
    class_min numeric; 
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

    LOOP  
        IF i > breaks THEN  EXIT;  END IF;  


        bot = floor((element_count / breaks) * (i - 1)) + 1;
        IF i = breaks THEN
            top = array_upper(in_array, 1);
        ELSE
            top = floor((element_count / breaks) * i);
        END IF;
        IF i = 1 THEN 
            classes = ARRAY[ARRAY[bot,top]]; 
        ELSE 
            classes = ARRAY_CAT(classes,ARRAY[bot,top]); 
        END IF;
        i := i+1; 
    END LOOP; 
    -- Calculate the sum of squared deviations from the array mean (SDAM).
    SELECT sum((arr_mean - e)^2) INTO sdam FROM (  SELECT unnest(in_array) as e ) x; 
    --Identify the breaks for the lowest GVF
    LOOP   
        i = 1; 
        class_max = -1;  
        class_min = 1000000000000; 
        LOOP 
            -- get our mean
            SELECT avg(e) INTO class_avg FROM ( SELECT unnest(in_array[classes[i][1]:classes[i][2]]) as e) x;  
            -- find the deviation
            SELECT sum((class_avg-e)^2) INTO tmp_val FROM (   SELECT unnest(in_array[classes[i][1]:classes[i][2]]) as e  ) x;  
            IF i = 1 THEN 
                arr_gvf = ARRAY[tmp_val]; 
            ELSE 
                arr_gvf = array_append(arr_gvf, tmp_val); 
            END IF;
            i := i+1;  
            IF i > breaks THEN EXIT; END IF;  
        END LOOP;  
        -- calculate our new GVF
        SELECT sdam-sum(e) INTO new_gvf FROM (  SELECT unnest(arr_gvf) as e  ) x;  
        -- if no improvement was made, exit
        IF new_gvf < gvf THEN EXIT; END IF; 
        gvf = new_gvf;  
        i = 1;  
        LOOP  
            --establish directionality (uppward through classes or downward)
            IF arr_gvf[i] < class_min THEN   
                class_min = arr_gvf[i];   
                class_min_i = i;  
            END IF;  
            IF arr_gvf[i] > class_max THEN   
                class_max = arr_gvf[i];   
                class_max_i = i;  
            END IF;  
            i := i+1;  
            IF i > breaks THEN EXIT; END IF;  
        END LOOP;  
        IF class_max_i > class_min_i THEN
            class_min_i = class_max_i - 1;
        ELSE
            class_min_i = class_max_i + 1;
        END IF;
            --Move from higher class to a lower gid order
            IF class_max_i > class_min_i THEN
                classes[class_max_i][1] = classes[class_max_i][1] + 1;
                classes[class_min_i][2] = classes[class_min_i][2] + 1;
            ELSE -- Move from lower class UP into a higher class by gid
                classes[class_max_i][2] = classes[class_max_i][2] - 1;
                classes[class_min_i][1] = classes[class_min_i][1] - 1;
            END IF;
    END LOOP; 
    i = 1;
    LOOP  
        IF invert = TRUE THEN
            side = 1; --default returns bottom side of breaks, invert returns top side
        END IF;
        reply = array_append(reply, in_array[classes[i][side]]);  
        i = i+1;  
        IF i > breaks THEN  EXIT; END IF; 
    END LOOP; 
    RETURN reply; 
END; 
$$ language plpgsql IMMUTABLE;

