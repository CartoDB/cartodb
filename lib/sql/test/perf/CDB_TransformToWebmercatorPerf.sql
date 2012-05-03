-- Run psql with -tA switches and expect
-- CDB_TransformToWebmercatorTest_expect
select '1', ST_AsEWKT(ST_SnapToGrid(CDB_TransformToWebmercator(
 'SRID=4326;LINESTRING(90 90, 0 80)'), 1));
select '2', ST_AsEWKT(ST_SnapToGrid(CDB_TransformToWebmercator(
 'SRID=4326;LINESTRING(90 90, 0 90)'), 1));
select '3', ST_AsEWKT(ST_SnapToGrid(CDB_TransformToWebmercator(
 'SRID=4326;POINT(0 90)'), 1));
select '4', ST_AsEWKT(ST_SnapToGrid(CDB_TransformToWebmercator(
 'SRID=4326;MULTIPOINT(10 3, 0 90, 0 4)'), 1));
select '5', ST_AsEWKT(ST_SnapToGrid(CDB_TransformToWebmercator(
 'SRID=4326;MULTIPOINT(10 3)'), 1));
select '6', ST_AsEWKT(ST_SnapToGrid(CDB_TransformToWebmercator(
 'SRID=4326;MULTILINESTRING((90 90, 0 90),(0 4, -4 5))'), 1));
select '7', ST_AsEWKT(ST_SnapToGrid(CDB_TransformToWebmercator(
 'SRID=4326;POINT(5 3)'), 1));
