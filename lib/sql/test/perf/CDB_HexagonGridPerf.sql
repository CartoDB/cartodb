-- 25690 cells covering full webmercator extent
-- real    0m9.448s -- as of e0e76843f785a420c277a6fb2f762601570ffb98
-- real    0m0.243s -- as of 50c487b83837e4d5216fcc19d637dd8db6baa44a

SELECT count(*) FROM (
 SELECT CDB_HexagonGrid(ST_MakeEnvelope(-20194051, -20194051, 20194051, 20194051), 156543) ) f;
