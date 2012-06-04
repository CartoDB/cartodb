
WITH zoom AS ( select generate_series(0,2) as Z ),
range AS ( select z, generate_series(0, pow(2,z)::int-1) as r FROM zoom),
inp AS ( select z0.z, r1.r as x, r2.r as y FROM zoom z0, range r1, range r2 WHERE z0.z = r1.z and r1.z = r2.z ),
ext AS ( select x,y,z,CDB_XYZ_Extent(x,y,z) as g from inp )
select X::text || ',' || Y::text || ',' || Z::text as xyz,
       st_xmin(g), st_xmax(g), st_ymin(g), st_ymax(g)
       from ext;

