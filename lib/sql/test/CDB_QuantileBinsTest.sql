WITH data AS (
    SELECT array_agg(x) x FROM generate_series(1,100) x 
        WHERE x % 5 != 0 AND x % 7 != 0
    ) 
SELECT unnest(CDB_QuantileBins(x, 7)) FROM data