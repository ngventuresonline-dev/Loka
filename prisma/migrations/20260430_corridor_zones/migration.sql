-- Corridor zones for Bangalore: Kanakapura Rd / Bannerghatta Rd / Hosur Rd /
-- Old Madras Rd / Mysore Rd / Tumkur Rd. Locals describe location by the
-- road, not a bbox neighbourhood — a 12 km Kanakapura Road stretch isn't
-- 'JP Nagar' even if its lat/lng touches the JP Nagar bbox.
--
-- Examples this fixes:
--   Prestige Falcon City (lat 12.885, lng 77.563, 560062) was JP Nagar,
--                                                          now Kanakapura Road
--   Kalyani Magnum + Block II + IGS Kalyani Galaxy (lat 12.899, lng 77.597,
--     560076) were BTM Layout, then JP Nagar, now Bannerghatta Road
--
-- Also retires 'Arekere' (which was a single small spot inside the
-- Bannerghatta Road corridor — the road name reads true for locals).

WITH zones(idx, name, lat0, lat1, lng0, lng1) AS (VALUES
  ( 1,'Koramangala',12.912,12.958,77.598,77.638),
  ( 2,'Indiranagar',12.950,13.000,77.615,77.678),
  ( 3,'MG Road',12.955,12.998,77.572,77.638),
  ( 4,'Whitefield',12.952,13.005,77.732,77.802),
  ( 5,'Marathahalli',12.932,12.978,77.672,77.732),
  ( 6,'Jayanagar',12.910,12.948,77.572,77.608),
  ( 7,'Basavanagudi',12.928,12.972,77.540,77.588),
  ( 8,'Langford Town',12.938,12.972,77.568,77.622),
  ( 9,'BTM Layout',12.905,12.938,77.568,77.618),
  (10,'HSR Layout',12.895,12.940,77.605,77.660),
  (11,'Bommanahalli',12.860,12.895,77.620,77.660),
  (12,'Bellandur',12.918,12.952,77.660,77.715),
  (13,'Sarjapur Road',12.848,12.918,77.660,77.795),
  -- New corridor zones — local-vocabulary road names.
  (14,'Kanakapura Road',  12.830,12.918,77.500,77.575),
  (15,'Bannerghatta Road',12.825,12.910,77.580,77.625),
  (16,'Hosur Road',       12.830,12.880,77.625,77.690),
  (17,'Old Madras Road',  12.975,13.005,77.660,77.730),
  (18,'Mysore Road',      12.928,12.985,77.450,77.510),
  (19,'Tumkur Road',      13.005,13.080,77.460,77.530),
  -- Remaining named neighbourhoods.
  (20,'Uttarahalli',12.880,12.918,77.510,77.560),
  (21,'Banashankari',12.918,12.948,77.530,77.578),
  (22,'JP Nagar',12.872,12.928,77.560,77.605),
  (23,'Vijayanagar',12.938,12.988,77.488,77.548),
  (24,'Kengeri',12.868,12.945,77.442,77.502),
  (25,'Hulimavu',12.838,12.910,77.618,77.668),
  (26,'Electronic City',12.790,12.848,77.625,77.718),
  (27,'Shivajinagar',12.962,13.015,77.562,77.618),
  (28,'Frazer Town',12.965,13.018,77.592,77.658),
  (29,'Rajajinagar',12.965,13.020,77.508,77.562),
  (30,'Malleshwaram',12.972,13.028,77.528,77.595),
  (31,'New BEL Road',13.025,13.060,77.555,77.590),
  (32,'Yeshwanthpur',13.005,13.035,77.512,77.555),
  (33,'Peenya',13.005,13.075,77.462,77.528),
  (34,'RT Nagar',12.998,13.048,77.555,77.605),
  (35,'Hebbal',13.022,13.082,77.540,77.610),
  (36,'Sahakar Nagar',13.038,13.095,77.545,77.600),
  (37,'Manyata',13.025,13.082,77.598,77.668),
  (38,'Thanisandra',13.055,13.098,77.598,77.672),
  (39,'Yelahanka',13.075,13.158,77.538,77.648),
  (40,'Kalyan Nagar',12.998,13.055,77.618,77.678),
  (41,'Ramamurthynagar',12.992,13.055,77.642,77.715),
  (42,'KR Puram',12.975,13.042,77.665,77.742),
  (43,'Brookefield',12.955,13.005,77.695,77.762),
  (44,'Mahadevapura',12.962,13.025,77.682,77.742),
  (45,'Varthur',12.908,12.968,77.718,77.798)
)
UPDATE bangalore_societies o
SET neighborhood = (SELECT name FROM zones z WHERE o.latitude BETWEEN z.lat0 AND z.lat1 AND o.longitude BETWEEN z.lng0 AND z.lng1 ORDER BY z.idx LIMIT 1)
WHERE o.is_active = true AND o.latitude IS NOT NULL;

-- Same backfill for tech parks (CTE re-declared since Postgres CTEs are statement-scoped)
WITH zones(idx, name, lat0, lat1, lng0, lng1) AS (VALUES
  ( 1,'Koramangala',12.912,12.958,77.598,77.638),
  ( 2,'Indiranagar',12.950,13.000,77.615,77.678),
  ( 3,'MG Road',12.955,12.998,77.572,77.638),
  ( 4,'Whitefield',12.952,13.005,77.732,77.802),
  ( 5,'Marathahalli',12.932,12.978,77.672,77.732),
  ( 6,'Jayanagar',12.910,12.948,77.572,77.608),
  ( 7,'Basavanagudi',12.928,12.972,77.540,77.588),
  ( 8,'Langford Town',12.938,12.972,77.568,77.622),
  ( 9,'BTM Layout',12.905,12.938,77.568,77.618),
  (10,'HSR Layout',12.895,12.940,77.605,77.660),
  (11,'Bommanahalli',12.860,12.895,77.620,77.660),
  (12,'Bellandur',12.918,12.952,77.660,77.715),
  (13,'Sarjapur Road',12.848,12.918,77.660,77.795),
  (14,'Kanakapura Road',  12.830,12.918,77.500,77.575),
  (15,'Bannerghatta Road',12.825,12.910,77.580,77.625),
  (16,'Hosur Road',       12.830,12.880,77.625,77.690),
  (17,'Old Madras Road',  12.975,13.005,77.660,77.730),
  (18,'Mysore Road',      12.928,12.985,77.450,77.510),
  (19,'Tumkur Road',      13.005,13.080,77.460,77.530),
  (20,'Uttarahalli',12.880,12.918,77.510,77.560),
  (21,'Banashankari',12.918,12.948,77.530,77.578),
  (22,'JP Nagar',12.872,12.928,77.560,77.605),
  (23,'Vijayanagar',12.938,12.988,77.488,77.548),
  (24,'Kengeri',12.868,12.945,77.442,77.502),
  (25,'Hulimavu',12.838,12.910,77.618,77.668),
  (26,'Electronic City',12.790,12.848,77.625,77.718),
  (27,'Shivajinagar',12.962,13.015,77.562,77.618),
  (28,'Frazer Town',12.965,13.018,77.592,77.658),
  (29,'Rajajinagar',12.965,13.020,77.508,77.562),
  (30,'Malleshwaram',12.972,13.028,77.528,77.595),
  (31,'New BEL Road',13.025,13.060,77.555,77.590),
  (32,'Yeshwanthpur',13.005,13.035,77.512,77.555),
  (33,'Peenya',13.005,13.075,77.462,77.528),
  (34,'RT Nagar',12.998,13.048,77.555,77.605),
  (35,'Hebbal',13.022,13.082,77.540,77.610),
  (36,'Sahakar Nagar',13.038,13.095,77.545,77.600),
  (37,'Manyata',13.025,13.082,77.598,77.668),
  (38,'Thanisandra',13.055,13.098,77.598,77.672),
  (39,'Yelahanka',13.075,13.158,77.538,77.648),
  (40,'Kalyan Nagar',12.998,13.055,77.618,77.678),
  (41,'Ramamurthynagar',12.992,13.055,77.642,77.715),
  (42,'KR Puram',12.975,13.042,77.665,77.742),
  (43,'Brookefield',12.955,13.005,77.695,77.762),
  (44,'Mahadevapura',12.962,13.025,77.682,77.742),
  (45,'Varthur',12.908,12.968,77.718,77.798)
)
UPDATE bangalore_tech_parks o
SET neighborhood = (SELECT name FROM zones z WHERE o.latitude BETWEEN z.lat0 AND z.lat1 AND o.longitude BETWEEN z.lng0 AND z.lng1 ORDER BY z.idx LIMIT 1)
WHERE o.is_active = true AND o.latitude IS NOT NULL;
