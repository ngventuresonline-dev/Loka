-- Adds 40-zone neighbourhood classification (matching brand-intel) to
-- bangalore_societies + bangalore_tech_parks. Backfills via the same
-- priority-ordered bbox lookup that the brand-intel API uses for outlets.

ALTER TABLE bangalore_societies   ADD COLUMN IF NOT EXISTS neighborhood TEXT;
ALTER TABLE bangalore_tech_parks  ADD COLUMN IF NOT EXISTS neighborhood TEXT;

CREATE INDEX IF NOT EXISTS bangalore_societies_neighborhood_idx ON bangalore_societies(neighborhood);
CREATE INDEX IF NOT EXISTS bangalore_tech_parks_neighborhood_idx ON bangalore_tech_parks(neighborhood);

-- Societies backfill (CTE re-declared per statement; Postgres CTEs are
-- statement-scoped so we can't share between two UPDATEs).
WITH zones(idx, name, lat0, lat1, lng0, lng1) AS (VALUES
  ( 1,'Koramangala',     12.912,12.958,77.598,77.638),
  ( 2,'Indiranagar',     12.950,13.000,77.615,77.678),
  ( 3,'MG Road',         12.955,12.998,77.572,77.638),
  ( 4,'Whitefield',      12.952,13.005,77.732,77.802),
  ( 5,'Marathahalli',    12.932,12.978,77.672,77.732),
  ( 6,'Jayanagar',       12.910,12.948,77.572,77.608),
  ( 7,'Basavanagudi',    12.928,12.972,77.540,77.588),
  ( 8,'Langford Town',   12.938,12.972,77.568,77.622),
  ( 9,'BTM Layout',      12.905,12.938,77.568,77.618),
  (10,'HSR Layout',      12.895,12.940,77.605,77.660),
  (11,'Bommanahalli',    12.860,12.895,77.620,77.660),
  (12,'Bellandur',       12.918,12.952,77.660,77.715),
  (13,'Sarjapur Road',   12.848,12.918,77.660,77.795),
  (14,'Uttarahalli',     12.880,12.918,77.510,77.560),
  (15,'Banashankari',    12.918,12.948,77.530,77.578),
  (16,'JP Nagar',        12.872,12.928,77.560,77.605),
  (17,'Vijayanagar',     12.938,12.988,77.488,77.548),
  (18,'Kengeri',         12.868,12.945,77.442,77.502),
  (19,'Arekere',         12.838,12.915,77.548,77.618),
  (20,'Hulimavu',        12.838,12.915,77.618,77.668),
  (21,'Electronic City', 12.790,12.848,77.625,77.718),
  (22,'Shivajinagar',    12.962,13.015,77.562,77.618),
  (23,'Frazer Town',     12.965,13.018,77.592,77.658),
  (24,'Rajajinagar',     12.965,13.020,77.508,77.562),
  (25,'Malleshwaram',    12.972,13.028,77.528,77.595),
  (26,'New BEL Road',    13.025,13.060,77.555,77.590),
  (27,'Yeshwanthpur',    13.005,13.035,77.512,77.555),
  (28,'Peenya',          13.005,13.075,77.462,77.528),
  -- RT Nagar / Hebbal / Sahakar Nagar east edges tightened so the Manyata
  -- Embassy Business Park / Karle Town Centre cluster classifies to Manyata
  -- instead of leaking out.
  (29,'RT Nagar',        12.998,13.048,77.555,77.605),
  (30,'Hebbal',          13.022,13.082,77.540,77.610),
  (31,'Sahakar Nagar',   13.038,13.095,77.545,77.600),
  (32,'Manyata',         13.025,13.082,77.598,77.668),
  (33,'Thanisandra',     13.055,13.098,77.598,77.672),
  (34,'Yelahanka',       13.075,13.158,77.538,77.648),
  (35,'Kalyan Nagar',    12.998,13.055,77.618,77.678),
  (36,'Ramamurthynagar', 12.992,13.055,77.642,77.715),
  (37,'KR Puram',        12.975,13.042,77.665,77.742),
  (38,'Brookefield',     12.955,13.005,77.695,77.762),
  (39,'Mahadevapura',    12.962,13.025,77.682,77.742),
  (40,'Varthur',         12.908,12.968,77.718,77.798)
)
UPDATE bangalore_societies o
SET neighborhood = (SELECT name FROM zones z WHERE o.latitude BETWEEN z.lat0 AND z.lat1 AND o.longitude BETWEEN z.lng0 AND z.lng1 ORDER BY z.idx LIMIT 1)
WHERE o.is_active = true AND o.latitude IS NOT NULL;

-- Tech parks backfill
WITH zones(idx, name, lat0, lat1, lng0, lng1) AS (VALUES
  ( 1,'Koramangala',     12.912,12.958,77.598,77.638),
  ( 2,'Indiranagar',     12.950,13.000,77.615,77.678),
  ( 3,'MG Road',         12.955,12.998,77.572,77.638),
  ( 4,'Whitefield',      12.952,13.005,77.732,77.802),
  ( 5,'Marathahalli',    12.932,12.978,77.672,77.732),
  ( 6,'Jayanagar',       12.910,12.948,77.572,77.608),
  ( 7,'Basavanagudi',    12.928,12.972,77.540,77.588),
  ( 8,'Langford Town',   12.938,12.972,77.568,77.622),
  ( 9,'BTM Layout',      12.905,12.938,77.568,77.618),
  (10,'HSR Layout',      12.895,12.940,77.605,77.660),
  (11,'Bommanahalli',    12.860,12.895,77.620,77.660),
  (12,'Bellandur',       12.918,12.952,77.660,77.715),
  (13,'Sarjapur Road',   12.848,12.918,77.660,77.795),
  (14,'Uttarahalli',     12.880,12.918,77.510,77.560),
  (15,'Banashankari',    12.918,12.948,77.530,77.578),
  (16,'JP Nagar',        12.872,12.928,77.560,77.605),
  (17,'Vijayanagar',     12.938,12.988,77.488,77.548),
  (18,'Kengeri',         12.868,12.945,77.442,77.502),
  (19,'Arekere',         12.838,12.915,77.548,77.618),
  (20,'Hulimavu',        12.838,12.915,77.618,77.668),
  (21,'Electronic City', 12.790,12.848,77.625,77.718),
  (22,'Shivajinagar',    12.962,13.015,77.562,77.618),
  (23,'Frazer Town',     12.965,13.018,77.592,77.658),
  (24,'Rajajinagar',     12.965,13.020,77.508,77.562),
  (25,'Malleshwaram',    12.972,13.028,77.528,77.595),
  (26,'New BEL Road',    13.025,13.060,77.555,77.590),
  (27,'Yeshwanthpur',    13.005,13.035,77.512,77.555),
  (28,'Peenya',          13.005,13.075,77.462,77.528),
  (29,'RT Nagar',        12.998,13.048,77.555,77.605),
  (30,'Hebbal',          13.022,13.082,77.540,77.610),
  (31,'Sahakar Nagar',   13.038,13.095,77.545,77.600),
  (32,'Manyata',         13.025,13.082,77.598,77.668),
  (33,'Thanisandra',     13.055,13.098,77.598,77.672),
  (34,'Yelahanka',       13.075,13.158,77.538,77.648),
  (35,'Kalyan Nagar',    12.998,13.055,77.618,77.678),
  (36,'Ramamurthynagar', 12.992,13.055,77.642,77.715),
  (37,'KR Puram',        12.975,13.042,77.665,77.742),
  (38,'Brookefield',     12.955,13.005,77.695,77.762),
  (39,'Mahadevapura',    12.962,13.025,77.682,77.742),
  (40,'Varthur',         12.908,12.968,77.718,77.798)
)
UPDATE bangalore_tech_parks o
SET neighborhood = (SELECT name FROM zones z WHERE o.latitude BETWEEN z.lat0 AND z.lat1 AND o.longitude BETWEEN z.lng0 AND z.lng1 ORDER BY z.idx LIMIT 1)
WHERE o.is_active = true AND o.latitude IS NOT NULL;
