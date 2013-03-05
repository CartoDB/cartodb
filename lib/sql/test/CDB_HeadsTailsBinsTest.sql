WITH data AS (
    SELECT array_agg(x) x FROM generate_series(1,100) x 
        WHERE x % 5 != 0 AND x % 7 != 0
    ) 
SELECT round(unnest(CDB_HeadsTailsBins(x, 7)),2) FROM data