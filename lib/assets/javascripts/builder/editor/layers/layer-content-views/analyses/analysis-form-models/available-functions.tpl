WITH dep_fns AS (
    SELECT oid, proname, proargnames, proargtypes FROM pg_catalog.pg_proc WHERE proname ~* '^dep_ext_'
),
fns_argstypes AS (SELECT oid, array_agg((
        SELECT
        CASE
            WHEN typcategory = 'A' THEN 'array'
            WHEN typcategory = 'N' THEN 'number'
            WHEN typcategory = 'S' THEN 'string'
            WHEN typcategory = 'B' THEN 'boolean'
        ELSE 'unknown' END
        FROM pg_catalog.pg_type
        WHERE argtype = pg_catalog.pg_type.oid
    )) as argtypes
    FROM (
        SELECT pg_proc.oid, unnest(pg_proc.proargtypes) as argtype
        FROM pg_catalog.pg_proc, dep_fns
        WHERE pg_proc.oid = dep_fns.oid
    ) _q
    group by oid
),
fns_meta AS (
    SELECT
        dep_fns.proname,
        dep_fns.proargnames,
        fns_argstypes.argtypes,
        CASE WHEN fns_argstypes.argtypes[6] = 'array' THEN
            -- [whether it has a secondary node or not, where the extra parameters start, where to stop]
            ARRAY[1,7,array_length(argtypes,1)]
        ELSE
            ARRAY[0,5,array_length(argtypes,1)]
        END as p
    FROM dep_fns, fns_argstypes
    WHERE dep_fns.oid = fns_argstypes.oid
)
SELECT
    proname as fn_name,
    proargnames[p[2]:p[3]] as params_names,
    argtypes[p[2]:p[3]] as params_types,
    p[1]::boolean as has_secondary_node
FROM fns_meta
