BEGIN;
SET client_min_messages TO error;

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
-- See https://github.com/Vizzuality/cartodb/issues/901
select '8', ST_AsEWKT(ST_SnapToGrid(CDB_TransformToWebmercator(
 'SRID=4326;POLYGON((100 0, -100 -100, 100 -100, -100 0, 100 00))'), 1));
-- See https://github.com/Vizzuality/cartodb/issues/931
select '9', CDB_TransformToWebmercator(
 '0106000020E61000000100000001030000000100000007000000010000000000F87F9CDFD01E32095341010000000000F87F193B6F0A30095341010000000000F87FA10FBF4C1D095341010000000000F87F38E258111C095341010000000000F87F5196BAFF17095341010000000000F87F4F0550911B095341010000000000F87F9CDFD01E32095341'::geometry);
-- Already in webmercator, doun't touch, even if out of valid bounds
select '10', ST_AsEWKT(CDB_TransformToWebmercator('SRID=3857;POINT(-20037510 -30240972)'::geometry));
END;
