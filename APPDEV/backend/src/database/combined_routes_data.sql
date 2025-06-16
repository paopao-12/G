-- 1. Drop tables for a clean slate
DROP TABLE IF EXISTS distances CASCADE;
DROP TABLE IF EXISTS route_stops CASCADE;
DROP TABLE IF EXISTS stops CASCADE;
DROP TABLE IF EXISTS routes CASCADE;

-- 2. Recreate tables
CREATE TABLE routes (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

CREATE TABLE stops (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION
);

CREATE TABLE route_stops (
    id SERIAL PRIMARY KEY,
    route_id INTEGER REFERENCES routes(id) ON DELETE CASCADE,
    stop_id INTEGER REFERENCES stops(id) ON DELETE CASCADE,
    sequence_number INTEGER NOT NULL
);

CREATE TABLE distances (
    id SERIAL PRIMARY KEY,
    route_id INTEGER REFERENCES routes(id) ON DELETE CASCADE,
    origin_stop_id INTEGER REFERENCES stops(id) ON DELETE CASCADE,
    destination_stop_id INTEGER REFERENCES stops(id) ON DELETE CASCADE,
    distance_km DOUBLE PRECISION NOT NULL
);

-- 3. Insert all unique stops (with coordinates, no duplicates)
INSERT INTO stops (name, latitude, longitude) VALUES
('Matina Pangi', 7.0722, 125.6131),
('Matina Crossing', 7.0822, 125.6231),
('Matina Aplaya', 7.0833, 125.6244),
('Matina Public Market', 7.0744, 125.6155),
('Matina Town Square', 7.0733, 125.6144),
('Matina Shrine', 7.0722, 125.6131),
('Matina Elementary School', 7.0822, 125.6231),
('Matina High School', 7.0833, 125.6244),
('Matina Gym', 7.0744, 125.6155),
('Matina Health Center', 7.0733, 125.6144),
('Panabo Market', 7.3083, 125.6833),
('Crossing Cagangohan', 7.2983, 125.6733),
('Laurel Elementary School', 7.2883, 125.6633),
('Crossing Tagpore', 7.2783, 125.6533),
('Bucana Plantation', 7.2683, 125.6433),
('Crossing Licanan', 7.2583, 125.6333),
('Bunawan Elem. School', 7.2483, 125.6233),
('After Bunawan Elem. School', 7.2383, 125.6133),
('Mahayag', 7.2283, 125.6033),
('Mahayag RMTG', 7.2183, 125.5933),
('Davao Extension Lumber', 7.2083, 125.5833),
('Tibungco Elem. School', 7.1983, 125.5733),
('Ugy. College (Buhangin)', 7.1883, 125.5633),
('Bury, Ibanga Basketball Court', 7.1783, 125.5533),
('Bacantan', 7.1683, 125.5433),
('Panacan Public Market', 7.1583, 125.5333),
('Sagrada Familia St. (Km. 13)', 7.1483, 125.5233),
('Going to Babak', 7.1383, 125.5133),
('Marigold Wharf', 7.1283, 125.5033),
('Old Crossing Airport Road', 7.1183, 125.4933),
('Hizon Elem. School', 7.1083, 125.4833),
('Alcantra & Sons', 7.0983, 125.4733),
('Damosa', 7.0883, 125.4633),
('Alatade General Hospital', 7.0783, 125.4533),
('Crossing Ulas', 7.0683, 125.4433),
('Magsaysay Park', 7.0483, 125.4233),
('Agdao Crossing', 7.0383, 125.4133),
('Ecoland Terminal', 7.0283, 125.4033),
('Mindanao Coco Corp. (Diversion Rd.)', 7.1683, 125.5433),
('Land Mark', 7.1583, 125.5333),
('Camp Catitipan', 7.1483, 125.5233),
('R. Tecson Const. Supply (Km. 8)', 7.1383, 125.5133),
('Caltex Gas Station (Diversion Rd.)', 7.1283, 125.5033),
('Pagsab-asa (Buhangin Road)', 7.1183, 125.4933),
('Dacudao Fly Over', 7.1083, 125.4833),
('China Bank (near EMCOR Bajada)', 7.0983, 125.4733),
('V. Mapa St (Bajada)', 7.0883, 125.4633),
('Phil Post Office', 7.0783, 125.4533),
('Old Recto / Palma Gil', 7.0683, 125.4433),
('Ilustre', 7.0583, 125.4333),
('Crossing Jacinto St.', 7.0483, 125.4233),
('DCWD (Bajada)', 7.0383, 125.4133),
('Esermatak (Mt. Garden Cabaguio)', 7.0283, 125.4033),
('Metro Bank (Agdao Fly Over)', 7.0183, 125.3933),
('Subpicio Lines (L. Garcia)', 7.0083, 125.3833),
('Sauco/Magsaysay Sts.', 6.9983, 125.3733),
('Cor. Aurora / Roxas', 6.9883, 125.3633),
('Roxas/Recto', 6.9783, 125.3533),
('Redemptorist Church', 6.9683, 125.3433),
('Cor. Palma Gil (Obrero)', 6.9583, 125.3333),
('PLDT (Poncianno)', 6.9483, 125.3233),
('Roxas/Gomez', 6.9383, 125.3133),
('Coca Cola Plant', 6.9283, 125.3033),
('Central Park Shell (Crossing)', 6.9183, 125.2933),
('Quirino (Central Bank)', 6.9083, 125.2833),
('San Pedro St. near Bankerohan', 6.8983, 125.2733),
('SIR/Malinao Alliance Church', 6.8883, 125.2633),
('Bartolome R. Luardo Nat''l High', 6.8783, 125.2533),
('Puy Game Farm', 6.8683, 125.2433),
('Mulig Elem. School', 6.8583, 125.2333),
('Purok 5', 6.8483, 125.2233),
('Sta. Cruz Chapel, Bangkas HTS', 6.8383, 125.2133),
('Libby-Lubogan JCT', 6.8283, 125.2033),
('Toril College', 6.8183, 125.1933),
('Pepsi Cola Bottling', 6.8083, 125.1833),
('DepEd School Building', 6.7983, 125.1733),
('Ulas Crossing', 6.7883, 125.1633),
('Libby Crossing', 6.7783, 125.1533),
('Royal Valley Bangkal', 6.7683, 125.1433),
('Boundary Malita-Talomo', 6.7583, 125.1333),
('Bangkal Valley, HTS', 6.7483, 125.1233),
('La Suerte Gallen', 6.7383, 125.1133),
('Tulip Drive', 6.7283, 125.1033),
('Malayan College', 6.7183, 125.0933),
('Apo View Hotel', 6.7083, 125.0833)
ON CONFLICT (name) DO NOTHING;

-- 4. Insert all unique routes
INSERT INTO routes (name) VALUES
('Matina Pangi'),
('Matina Aplaya'),
('Panabo City – Davao City'),
('Panabo City via Buhangin'),
('Panacan via Cabaguio Avenue'),
('Panacan via JP Laurel Avenue'),
('Puan'),
('Panacan via Buhangin'),
('Panacan – SM City Route'),
('Mulig'),
('Bangkal'),
('Bago Aplaya'),
('Acacia-Indangan-Mahayag'),
('Catigan'),
('Catitipan via Dacudao'),
('Catitipan via JP Laurel Avenue'),
('Communal / Country Homes'),
('Dacoville'),
('Darong Route'),
('Bunawan'),
('Sasa'),
('Cabantian')
ON CONFLICT (name) DO NOTHING;

-- 5. Insert route_stops and distances for each route
-- (You can now use the dynamic lookup pattern for each route, as described above)
-- Example for Matina Pangi:
-- (Repeat for each route, using the correct stop order and distances)

-- Matina Pangi route_stops
INSERT INTO route_stops (route_id, stop_id, sequence_number)
SELECT r.id, s.id, seq.seq
FROM routes r
JOIN (VALUES
    ('Matina Pangi', 1, 'Matina Pangi'),
    ('Matina Pangi', 2, 'Matina Crossing'),
    ('Matina Pangi', 3, 'Matina Public Market'),
    ('Matina Pangi', 4, 'Matina Town Square'),
    ('Matina Pangi', 5, 'Matina Shrine'),
    ('Matina Pangi', 6, 'Matina Elementary School'),
    ('Matina Pangi', 7, 'Matina High School'),
    ('Matina Pangi', 8, 'Matina Gym'),
    ('Matina Pangi', 9, 'Matina Health Center'),
    ('Matina Pangi', 10, 'Matina Aplaya')
) AS seq(route_name, seq, stop_name)
    ON r.name = seq.route_name
JOIN stops s ON s.name = seq.stop_name;

-- Matina Pangi distances
INSERT INTO distances (route_id, origin_stop_id, destination_stop_id, distance_km)
SELECT r.id, s1.id, s2.id, d.dist
FROM routes r
JOIN (VALUES
    ('Matina Pangi', 'Matina Pangi', 'Matina Crossing', 0.8),
    ('Matina Pangi', 'Matina Crossing', 'Matina Public Market', 0.7),
    ('Matina Pangi', 'Matina Public Market', 'Matina Town Square', 0.6),
    ('Matina Pangi', 'Matina Town Square', 'Matina Shrine', 0.7),
    ('Matina Pangi', 'Matina Shrine', 'Matina Elementary School', 0.8),
    ('Matina Pangi', 'Matina Elementary School', 'Matina High School', 0.6),
    ('Matina Pangi', 'Matina High School', 'Matina Gym', 0.7),
    ('Matina Pangi', 'Matina Gym', 'Matina Health Center', 0.8),
    ('Matina Pangi', 'Matina Health Center', 'Matina Aplaya', 0.6)
) AS d(route_name, origin, dest, dist)
    ON r.name = d.route_name
JOIN stops s1 ON s1.name = d.origin
JOIN stops s2 ON s2.name = d.dest;

-- Matina Aplaya route_stops
INSERT INTO route_stops (route_id, stop_id, sequence_number)
SELECT r.id, s.id, seq.seq
FROM routes r
JOIN (VALUES
    ('Matina Aplaya', 1, 'Matina Aplaya'),
    ('Matina Aplaya', 2, 'Matina Health Center'),
    ('Matina Aplaya', 3, 'Matina Gym'),
    ('Matina Aplaya', 4, 'Matina High School'),
    ('Matina Aplaya', 5, 'Matina Elementary School'),
    ('Matina Aplaya', 6, 'Matina Shrine'),
    ('Matina Aplaya', 7, 'Matina Town Square'),
    ('Matina Aplaya', 8, 'Matina Public Market'),
    ('Matina Aplaya', 9, 'Matina Crossing'),
    ('Matina Aplaya', 10, 'Matina Pangi')
) AS seq(route_name, seq, stop_name)
    ON r.name = seq.route_name
JOIN stops s ON s.name = seq.stop_name;

-- Matina Aplaya distances
INSERT INTO distances (route_id, origin_stop_id, destination_stop_id, distance_km)
SELECT r.id, s1.id, s2.id, d.dist
FROM routes r
JOIN (VALUES
    ('Matina Aplaya', 'Matina Aplaya', 'Matina Health Center', 0.6),
    ('Matina Aplaya', 'Matina Health Center', 'Matina Gym', 0.7),
    ('Matina Aplaya', 'Matina Gym', 'Matina High School', 0.8),
    ('Matina Aplaya', 'Matina High School', 'Matina Elementary School', 0.6),
    ('Matina Aplaya', 'Matina Elementary School', 'Matina Shrine', 0.7),
    ('Matina Aplaya', 'Matina Shrine', 'Matina Town Square', 0.8),
    ('Matina Aplaya', 'Matina Town Square', 'Matina Public Market', 0.6),
    ('Matina Aplaya', 'Matina Public Market', 'Matina Crossing', 0.7),
    ('Matina Aplaya', 'Matina Crossing', 'Matina Pangi', 0.8)
) AS d(route_name, origin, dest, dist)
    ON r.name = d.route_name
JOIN stops s1 ON s1.name = d.origin
JOIN stops s2 ON s2.name = d.dest;

-- Panabo City – Davao City route_stops
INSERT INTO route_stops (route_id, stop_id, sequence_number)
SELECT r.id, s.id, seq.seq
FROM routes r
JOIN (VALUES
    ('Panabo City – Davao City', 1, 'Panabo Market'),
    ('Panabo City – Davao City', 2, 'Crossing Cagangohan'),
    ('Panabo City – Davao City', 3, 'Laurel Elementary School'),
    ('Panabo City – Davao City', 4, 'Crossing Tagpore'),
    ('Panabo City – Davao City', 5, 'Bucana Plantation'),
    ('Panabo City – Davao City', 6, 'Crossing Licanan'),
    ('Panabo City – Davao City', 7, 'Bunawan Elem. School'),
    ('Panabo City – Davao City', 8, 'After Bunawan Elem. School'),
    ('Panabo City – Davao City', 9, 'Mahayag'),
    ('Panabo City – Davao City', 10, 'Mahayag RMTG'),
    ('Panabo City – Davao City', 11, 'Davao Extension Lumber'),
    ('Panabo City – Davao City', 12, 'Tibungco Elem. School'),
    ('Panabo City – Davao City', 13, 'Ugy. College (Buhangin)'),
    ('Panabo City – Davao City', 14, 'Bury, Ibanga Basketball Court'),
    ('Panabo City – Davao City', 15, 'Bacantan'),
    ('Panabo City – Davao City', 16, 'Panacan Public Market'),
    ('Panabo City – Davao City', 17, 'Sagrada Familia St. (Km. 13)'),
    ('Panabo City – Davao City', 18, 'Going to Babak'),
    ('Panabo City – Davao City', 19, 'Marigold Wharf'),
    ('Panabo City – Davao City', 20, 'Old Crossing Airport Road'),
    ('Panabo City – Davao City', 21, 'Hizon Elem. School'),
    ('Panabo City – Davao City', 22, 'Alcantra & Sons'),
    ('Panabo City – Davao City', 23, 'Damosa'),
    ('Panabo City – Davao City', 24, 'Alatade General Hospital'),
    ('Panabo City – Davao City', 25, 'Crossing Ulas'),
    ('Panabo City – Davao City', 26, 'Almendras Gym'),
    ('Panabo City – Davao City', 27, 'Magsaysay Park'),
    ('Panabo City – Davao City', 28, 'Agdao Crossing'),
    ('Panabo City – Davao City', 29, 'Ecoland Terminal')
) AS seq(route_name, seq, stop_name)
    ON r.name = seq.route_name
JOIN stops s ON s.name = seq.stop_name;

-- Panabo City – Davao City distances
INSERT INTO distances (route_id, origin_stop_id, destination_stop_id, distance_km)
SELECT r.id, s1.id, s2.id, d.dist
FROM routes r
JOIN (VALUES
    ('Panabo City – Davao City', 'Panabo Market', 'Crossing Cagangohan', 1.2),
    ('Panabo City – Davao City', 'Crossing Cagangohan', 'Laurel Elementary School', 0.8),
    ('Panabo City – Davao City', 'Laurel Elementary School', 'Crossing Tagpore', 1.0),
    ('Panabo City – Davao City', 'Crossing Tagpore', 'Bucana Plantation', 0.9),
    ('Panabo City – Davao City', 'Bucana Plantation', 'Crossing Licanan', 1.1),
    ('Panabo City – Davao City', 'Crossing Licanan', 'Bunawan Elem. School', 0.8),
    ('Panabo City – Davao City', 'Bunawan Elem. School', 'After Bunawan Elem. School', 0.7),
    ('Panabo City – Davao City', 'After Bunawan Elem. School', 'Mahayag', 1.0),
    ('Panabo City – Davao City', 'Mahayag', 'Mahayag RMTG', 0.9),
    ('Panabo City – Davao City', 'Mahayag RMTG', 'Davao Extension Lumber', 1.1),
    ('Panabo City – Davao City', 'Davao Extension Lumber', 'Tibungco Elem. School', 0.8),
    ('Panabo City – Davao City', 'Tibungco Elem. School', 'Ugy. College (Buhangin)', 1.0),
    ('Panabo City – Davao City', 'Ugy. College (Buhangin)', 'Bury, Ibanga Basketball Court', 0.9),
    ('Panabo City – Davao City', 'Bury, Ibanga Basketball Court', 'Bacantan', 1.1),
    ('Panabo City – Davao City', 'Bacantan', 'Panacan Public Market', 0.8),
    ('Panabo City – Davao City', 'Panacan Public Market', 'Sagrada Familia St. (Km. 13)', 1.0),
    ('Panabo City – Davao City', 'Sagrada Familia St. (Km. 13)', 'Going to Babak', 0.9),
    ('Panabo City – Davao City', 'Going to Babak', 'Marigold Wharf', 1.1),
    ('Panabo City – Davao City', 'Marigold Wharf', 'Old Crossing Airport Road', 0.8),
    ('Panabo City – Davao City', 'Old Crossing Airport Road', 'Hizon Elem. School', 1.0),
    ('Panabo City – Davao City', 'Hizon Elem. School', 'Alcantra & Sons', 0.9),
    ('Panabo City – Davao City', 'Alcantra & Sons', 'Damosa', 1.1),
    ('Panabo City – Davao City', 'Damosa', 'Alatade General Hospital', 0.8),
    ('Panabo City – Davao City', 'Alatade General Hospital', 'Crossing Ulas', 1.0),
    ('Panabo City – Davao City', 'Crossing Ulas', 'Almendras Gym', 0.9),
    ('Panabo City – Davao City', 'Almendras Gym', 'Magsaysay Park', 1.1),
    ('Panabo City – Davao City', 'Magsaysay Park', 'Agdao Crossing', 0.8),
    ('Panabo City – Davao City', 'Agdao Crossing', 'Ecoland Terminal', 1.0)
) AS d(route_name, origin, dest, dist)
    ON r.name = d.route_name
JOIN stops s1 ON s1.name = d.origin
JOIN stops s2 ON s2.name = d.dest;

-- Panabo City via Buhangin route_stops
INSERT INTO route_stops (route_id, stop_id, sequence_number)
SELECT r.id, s.id, seq.seq
FROM routes r
JOIN (VALUES
    ('Panacan via Buhangin', 1, 'Panacan Public Market'),
    ('Panacan via Buhangin', 2, 'Sagrada Familia St. (Km. 13)'),
    ('Panacan via Buhangin', 3, 'Going to Babak'),
    ('Panacan via Buhangin', 4, 'Marigold Wharf'),
    ('Panacan via Buhangin', 5, 'Old Crossing Airport Road'),
    ('Panacan via Buhangin', 6, 'Hizon Elem. School'),
    ('Panacan via Buhangin', 7, 'Alcantra & Sons'),
    ('Panacan via Buhangin', 8, 'Damosa'),
    ('Panacan via Buhangin', 9, 'Alatade General Hospital'),
    ('Panacan via Buhangin', 10, 'Crossing Ulas'),
    ('Panacan via Buhangin', 11, 'Almendras Gym'),
    ('Panacan via Buhangin', 12, 'Magsaysay Park'),
    ('Panacan via Buhangin', 13, 'Agdao Crossing'),
    ('Panacan via Buhangin', 14, 'Ecoland Terminal')
) AS seq(route_name, seq, stop_name)
    ON r.name = seq.route_name
JOIN stops s ON s.name = seq.stop_name;

-- Panacan via Buhangin distances
INSERT INTO distances (route_id, origin_stop_id, destination_stop_id, distance_km)
SELECT r.id, s1.id, s2.id, d.dist
FROM routes r
JOIN (VALUES
    ('Panacan via Buhangin', 'Panacan Public Market', 'Sagrada Familia St. (Km. 13)', 1.0),
    ('Panacan via Buhangin', 'Sagrada Familia St. (Km. 13)', 'Going to Babak', 0.9),
    ('Panacan via Buhangin', 'Going to Babak', 'Marigold Wharf', 1.1),
    ('Panacan via Buhangin', 'Marigold Wharf', 'Old Crossing Airport Road', 0.8),
    ('Panacan via Buhangin', 'Old Crossing Airport Road', 'Hizon Elem. School', 1.0),
    ('Panacan via Buhangin', 'Hizon Elem. School', 'Alcantra & Sons', 0.9),
    ('Panacan via Buhangin', 'Alcantra & Sons', 'Damosa', 1.1),
    ('Panacan via Buhangin', 'Damosa', 'Alatade General Hospital', 0.8),
    ('Panacan via Buhangin', 'Alatade General Hospital', 'Crossing Ulas', 1.0),
    ('Panacan via Buhangin', 'Crossing Ulas', 'Almendras Gym', 0.9),
    ('Panacan via Buhangin', 'Almendras Gym', 'Magsaysay Park', 1.1),
    ('Panacan via Buhangin', 'Magsaysay Park', 'Agdao Crossing', 0.8),
    ('Panacan via Buhangin', 'Agdao Crossing', 'Ecoland Terminal', 1.0)
) AS d(route_name, origin, dest, dist)
    ON r.name = d.route_name
JOIN stops s1 ON s1.name = d.origin
JOIN stops s2 ON s2.name = d.dest;

-- Panacan via Cabaguio Avenue route_stops
INSERT INTO route_stops (route_id, stop_id, sequence_number)
SELECT r.id, s.id, seq.seq
FROM routes r
JOIN (VALUES
    ('Panacan via Cabaguio Avenue', 1, 'Panacan Public Market'),
    ('Panacan via Cabaguio Avenue', 2, 'Sagrada Familia St. (Km. 13)'),
    ('Panacan via Cabaguio Avenue', 3, 'Going to Babak'),
    ('Panacan via Cabaguio Avenue', 4, 'Marigold Wharf'),
    ('Panacan via Cabaguio Avenue', 5, 'Old Crossing Airport Road'),
    ('Panacan via Cabaguio Avenue', 6, 'Hizon Elem. School'),
    ('Panacan via Cabaguio Avenue', 7, 'Alcantra & Sons'),
    ('Panacan via Cabaguio Avenue', 8, 'Damosa'),
    ('Panacan via Cabaguio Avenue', 9, 'Alatade General Hospital'),
    ('Panacan via Cabaguio Avenue', 10, 'Crossing Ulas'),
    ('Panacan via Cabaguio Avenue', 11, 'Almendras Gym'),
    ('Panacan via Cabaguio Avenue', 12, 'Magsaysay Park'),
    ('Panacan via Cabaguio Avenue', 13, 'Agdao Crossing'),
    ('Panacan via Cabaguio Avenue', 14, 'Ecoland Terminal')
) AS seq(route_name, seq, stop_name)
    ON r.name = seq.route_name
JOIN stops s ON s.name = seq.stop_name;

-- Panacan via Cabaguio Avenue distances
INSERT INTO distances (route_id, origin_stop_id, destination_stop_id, distance_km)
SELECT r.id, s1.id, s2.id, d.dist
FROM routes r
JOIN (VALUES
    ('Panacan via Cabaguio Avenue', 'Panacan Public Market', 'Sagrada Familia St. (Km. 13)', 1.0),
    ('Panacan via Cabaguio Avenue', 'Sagrada Familia St. (Km. 13)', 'Going to Babak', 0.9),
    ('Panacan via Cabaguio Avenue', 'Going to Babak', 'Marigold Wharf', 1.1),
    ('Panacan via Cabaguio Avenue', 'Marigold Wharf', 'Old Crossing Airport Road', 0.8),
    ('Panacan via Cabaguio Avenue', 'Old Crossing Airport Road', 'Hizon Elem. School', 1.0),
    ('Panacan via Cabaguio Avenue', 'Hizon Elem. School', 'Alcantra & Sons', 0.9),
    ('Panacan via Cabaguio Avenue', 'Alcantra & Sons', 'Damosa', 1.1),
    ('Panacan via Cabaguio Avenue', 'Damosa', 'Alatade General Hospital', 0.8),
    ('Panacan via Cabaguio Avenue', 'Alatade General Hospital', 'Crossing Ulas', 1.0),
    ('Panacan via Cabaguio Avenue', 'Crossing Ulas', 'Almendras Gym', 0.9),
    ('Panacan via Cabaguio Avenue', 'Almendras Gym', 'Magsaysay Park', 1.1),
    ('Panacan via Cabaguio Avenue', 'Magsaysay Park', 'Agdao Crossing', 0.8),
    ('Panacan via Cabaguio Avenue', 'Agdao Crossing', 'Ecoland Terminal', 1.0)
) AS d(route_name, origin, dest, dist)
    ON r.name = d.route_name
JOIN stops s1 ON s1.name = d.origin
JOIN stops s2 ON s2.name = d.dest;

-- Panacan via JP Laurel Avenue route_stops
INSERT INTO route_stops (route_id, stop_id, sequence_number)
SELECT r.id, s.id, seq.seq
FROM routes r
JOIN (VALUES
    ('Panacan via JP Laurel Avenue', 1, 'Panacan Public Market'),
    ('Panacan via JP Laurel Avenue', 2, 'Sagrada Familia St. (Km. 13)'),
    ('Panacan via JP Laurel Avenue', 3, 'Going to Babak'),
    ('Panacan via JP Laurel Avenue', 4, 'Marigold Wharf'),
    ('Panacan via JP Laurel Avenue', 5, 'Old Crossing Airport Road'),
    ('Panacan via JP Laurel Avenue', 6, 'Hizon Elem. School'),
    ('Panacan via JP Laurel Avenue', 7, 'Alcantra & Sons'),
    ('Panacan via JP Laurel Avenue', 8, 'Damosa'),
    ('Panacan via JP Laurel Avenue', 9, 'Alatade General Hospital'),
    ('Panacan via JP Laurel Avenue', 10, 'Crossing Ulas'),
    ('Panacan via JP Laurel Avenue', 11, 'Almendras Gym'),
    ('Panacan via JP Laurel Avenue', 12, 'Magsaysay Park'),
    ('Panacan via JP Laurel Avenue', 13, 'Agdao Crossing'),
    ('Panacan via JP Laurel Avenue', 14, 'Ecoland Terminal')
) AS seq(route_name, seq, stop_name)
    ON r.name = seq.route_name
JOIN stops s ON s.name = seq.stop_name;

-- Panacan via JP Laurel Avenue distances
INSERT INTO distances (route_id, origin_stop_id, destination_stop_id, distance_km)
SELECT r.id, s1.id, s2.id, d.dist
FROM routes r
JOIN (VALUES
    ('Panacan via JP Laurel Avenue', 'Panacan Public Market', 'Sagrada Familia St. (Km. 13)', 1.0),
    ('Panacan via JP Laurel Avenue', 'Sagrada Familia St. (Km. 13)', 'Going to Babak', 0.9),
    ('Panacan via JP Laurel Avenue', 'Going to Babak', 'Marigold Wharf', 1.1),
    ('Panacan via JP Laurel Avenue', 'Marigold Wharf', 'Old Crossing Airport Road', 0.8),
    ('Panacan via JP Laurel Avenue', 'Old Crossing Airport Road', 'Hizon Elem. School', 1.0),
    ('Panacan via JP Laurel Avenue', 'Hizon Elem. School', 'Alcantra & Sons', 0.9),
    ('Panacan via JP Laurel Avenue', 'Alcantra & Sons', 'Damosa', 1.1),
    ('Panacan via JP Laurel Avenue', 'Damosa', 'Alatade General Hospital', 0.8),
    ('Panacan via JP Laurel Avenue', 'Alatade General Hospital', 'Crossing Ulas', 1.0),
    ('Panacan via JP Laurel Avenue', 'Crossing Ulas', 'Almendras Gym', 0.9),
    ('Panacan via JP Laurel Avenue', 'Almendras Gym', 'Magsaysay Park', 1.1),
    ('Panacan via JP Laurel Avenue', 'Magsaysay Park', 'Agdao Crossing', 0.8),
    ('Panacan via JP Laurel Avenue', 'Agdao Crossing', 'Ecoland Terminal', 1.0)
) AS d(route_name, origin, dest, dist)
    ON r.name = d.route_name
JOIN stops s1 ON s1.name = d.origin
JOIN stops s2 ON s2.name = d.dest;

-- Panacan via Sasa route_stops
INSERT INTO route_stops (route_id, stop_id, sequence_number)
SELECT r.id, s.id, seq.seq
FROM routes r
JOIN (VALUES
    ('Sasa', 1, 'Sasa'),
    ('Sasa', 2, 'V. Mapa St (Bajada)'),
    ('Sasa', 3, 'Phil Post Office'),
    ('Sasa', 4, 'Old Recto / Palma Gil'),
    ('Sasa', 5, 'Ilustre')
) AS seq(route_name, seq, stop_name)
    ON r.name = seq.route_name
JOIN stops s ON s.name = seq.stop_name;

-- Sasa distances
INSERT INTO distances (route_id, origin_stop_id, destination_stop_id, distance_km)
SELECT r.id, s1.id, s2.id, d.dist
FROM routes r
JOIN (VALUES
    ('Sasa', 'Sasa', 'V. Mapa St (Bajada)', 0.8),
    ('Sasa', 'V. Mapa St (Bajada)', 'Phil Post Office', 0.7),
    ('Sasa', 'Phil Post Office', 'Old Recto / Palma Gil', 0.9),
    ('Sasa', 'Old Recto / Palma Gil', 'Ilustre', 1.0)
) AS d(route_name, origin, dest, dist)
    ON r.name = d.route_name
JOIN stops s1 ON s1.name = d.origin
JOIN stops s2 ON s2.name = d.dest;

-- Panacan via Diversion Road route_stops
INSERT INTO route_stops (route_id, stop_id, sequence_number)
SELECT r.id, s.id, seq.seq
FROM routes r
JOIN (VALUES
    ('Panacan via Diversion Road', 1, 'Panacan Public Market'),
    ('Panacan via Diversion Road', 2, 'Sagrada Familia St. (Km. 13)'),
    ('Panacan via Diversion Road', 3, 'Going to Babak'),
    ('Panacan via Diversion Road', 4, 'Marigold Wharf'),
    ('Panacan via Diversion Road', 5, 'Old Crossing Airport Road'),
    ('Panacan via Diversion Road', 6, 'Hizon Elem. School'),
    ('Panacan via Diversion Road', 7, 'Alcantra & Sons'),
    ('Panacan via Diversion Road', 8, 'Damosa'),
    ('Panacan via Diversion Road', 9, 'Alatade General Hospital'),
    ('Panacan via Diversion Road', 10, 'Crossing Ulas'),
    ('Panacan via Diversion Road', 11, 'Almendras Gym'),
    ('Panacan via Diversion Road', 12, 'Magsaysay Park'),
    ('Panacan via Diversion Road', 13, 'Agdao Crossing'),
    ('Panacan via Diversion Road', 14, 'Ecoland Terminal')
) AS seq(route_name, seq, stop_name)
    ON r.name = seq.route_name
JOIN stops s ON s.name = seq.stop_name;

-- Panacan via Diversion Road distances
INSERT INTO distances (route_id, origin_stop_id, destination_stop_id, distance_km)
SELECT r.id, s1.id, s2.id, d.dist
FROM routes r
JOIN (VALUES
    ('Panacan via Diversion Road', 'Panacan Public Market', 'Sagrada Familia St. (Km. 13)', 1.0),
    ('Panacan via Diversion Road', 'Sagrada Familia St. (Km. 13)', 'Going to Babak', 0.9),
    ('Panacan via Diversion Road', 'Going to Babak', 'Marigold Wharf', 1.1),
    ('Panacan via Diversion Road', 'Marigold Wharf', 'Old Crossing Airport Road', 0.8),
    ('Panacan via Diversion Road', 'Old Crossing Airport Road', 'Hizon Elem. School', 1.0),
    ('Panacan via Diversion Road', 'Hizon Elem. School', 'Alcantra & Sons', 0.9),
    ('Panacan via Diversion Road', 'Alcantra & Sons', 'Damosa', 1.1),
    ('Panacan via Diversion Road', 'Damosa', 'Alatade General Hospital', 0.8),
    ('Panacan via Diversion Road', 'Alatade General Hospital', 'Crossing Ulas', 1.0),
    ('Panacan via Diversion Road', 'Crossing Ulas', 'Almendras Gym', 0.9),
    ('Panacan via Diversion Road', 'Almendras Gym', 'Magsaysay Park', 1.1),
    ('Panacan via Diversion Road', 'Magsaysay Park', 'Agdao Crossing', 0.8),
    ('Panacan via Diversion Road', 'Agdao Crossing', 'Ecoland Terminal', 1.0)
) AS d(route_name, origin, dest, dist)
    ON r.name = d.route_name
JOIN stops s1 ON s1.name = d.origin
JOIN stops s2 ON s2.name = d.dest;

-- Puan route_stops
INSERT INTO route_stops (route_id, stop_id, sequence_number)
SELECT r.id, s.id, seq.seq
FROM routes r
JOIN (VALUES
    ('Puan', 1, 'Puan'),
    ('Puan', 2, 'Bangkal Valley, HTS'),
    ('Puan', 3, 'Royal Valley Bangkal'),
    ('Puan', 4, 'Boundary Malita-Talomo'),
    ('Puan', 5, 'Libby Crossing'),
    ('Puan', 6, 'Ulas Crossing'),
    ('Puan', 7, 'DepEd School Building'),
    ('Puan', 8, 'Pepsi Cola Bottling'),
    ('Puan', 9, 'Toril College'),
    ('Puan', 10, 'Libby-Lubogan JCT'),
    ('Puan', 11, 'Sta. Cruz Chapel, Bangkas HTS'),
    ('Puan', 12, 'Purok 5'),
    ('Puan', 13, 'Mulig Elem. School')
) AS seq(route_name, seq, stop_name)
    ON r.name = seq.route_name
JOIN stops s ON s.name = seq.stop_name;

-- Puan distances
INSERT INTO distances (route_id, origin_stop_id, destination_stop_id, distance_km)
SELECT r.id, s1.id, s2.id, d.dist
FROM routes r
JOIN (VALUES
    ('Puan', 'Puan', 'Bangkal Valley, HTS', 1.0),
    ('Puan', 'Bangkal Valley, HTS', 'Royal Valley Bangkal', 0.8),
    ('Puan', 'Royal Valley Bangkal', 'Boundary Malita-Talomo', 0.7),
    ('Puan', 'Boundary Malita-Talomo', 'Libby Crossing', 0.9),
    ('Puan', 'Libby Crossing', 'Ulas Crossing', 1.1),
    ('Puan', 'Ulas Crossing', 'DepEd School Building', 0.8),
    ('Puan', 'DepEd School Building', 'Pepsi Cola Bottling', 0.7),
    ('Puan', 'Pepsi Cola Bottling', 'Toril College', 0.9),
    ('Puan', 'Toril College', 'Libby-Lubogan JCT', 1.1),
    ('Puan', 'Libby-Lubogan JCT', 'Sta. Cruz Chapel, Bangkas HTS', 0.8),
    ('Puan', 'Sta. Cruz Chapel, Bangkas HTS', 'Purok 5', 0.7),
    ('Puan', 'Purok 5', 'Mulig Elem. School', 0.9)
) AS d(route_name, origin, dest, dist)
    ON r.name = d.route_name
JOIN stops s1 ON s1.name = d.origin
JOIN stops s2 ON s2.name = d.dest;

-- Mulig route_stops
INSERT INTO route_stops (route_id, stop_id, sequence_number)
SELECT r.id, s.id, seq.seq
FROM routes r
JOIN (VALUES
    ('Mulig', 1, 'Mulig Elem. School'),
    ('Mulig', 2, 'Purok 5'),
    ('Mulig', 3, 'Sta. Cruz Chapel, Bangkas HTS'),
    ('Mulig', 4, 'Libby-Lubogan JCT'),
    ('Mulig', 5, 'Toril College'),
    ('Mulig', 6, 'Pepsi Cola Bottling'),
    ('Mulig', 7, 'DepEd School Building'),
    ('Mulig', 8, 'Ulas Crossing'),
    ('Mulig', 9, 'Libby Crossing'),
    ('Mulig', 10, 'Royal Valley Bangkal'),
    ('Mulig', 11, 'Boundary Malita-Talomo'),
    ('Mulig', 12, 'Bangkal Valley, HTS'),
    ('Mulig', 13, 'La Suerte Gallen'),
    ('Mulig', 14, 'Tulip Drive'),
    ('Mulig', 15, 'Malayan College'),
    ('Mulig', 16, 'Apo View Hotel')
) AS seq(route_name, seq, stop_name)
    ON r.name = seq.route_name
JOIN stops s ON s.name = seq.stop_name;

-- Mulig distances
INSERT INTO distances (route_id, origin_stop_id, destination_stop_id, distance_km)
SELECT r.id, s1.id, s2.id, d.dist
FROM routes r
JOIN (VALUES
    ('Mulig', 'Mulig Elem. School', 'Purok 5', 0.7),
    ('Mulig', 'Purok 5', 'Sta. Cruz Chapel, Bangkas HTS', 0.8),
    ('Mulig', 'Sta. Cruz Chapel, Bangkas HTS', 'Libby-Lubogan JCT', 0.9),
    ('Mulig', 'Libby-Lubogan JCT', 'Toril College', 1.0),
    ('Mulig', 'Toril College', 'Pepsi Cola Bottling', 0.8),
    ('Mulig', 'Pepsi Cola Bottling', 'DepEd School Building', 0.7),
    ('Mulig', 'DepEd School Building', 'Ulas Crossing', 0.9),
    ('Mulig', 'Ulas Crossing', 'Libby Crossing', 1.1),
    ('Mulig', 'Libby Crossing', 'Royal Valley Bangkal', 0.8),
    ('Mulig', 'Royal Valley Bangkal', 'Boundary Malita-Talomo', 0.7),
    ('Mulig', 'Boundary Malita-Talomo', 'Bangkal Valley, HTS', 0.9),
    ('Mulig', 'Bangkal Valley, HTS', 'La Suerte Gallen', 1.0),
    ('Mulig', 'La Suerte Gallen', 'Tulip Drive', 0.8),
    ('Mulig', 'Tulip Drive', 'Malayan College', 0.7),
    ('Mulig', 'Malayan College', 'Apo View Hotel', 0.9)
) AS d(route_name, origin, dest, dist)
    ON r.name = d.route_name
JOIN stops s1 ON s1.name = d.origin
JOIN stops s2 ON s2.name = d.dest;

-- Catigan route_stops
INSERT INTO route_stops (route_id, stop_id, sequence_number)
SELECT r.id, s.id, seq.seq
FROM routes r
JOIN (VALUES
    ('Catigan', 1, 'Catigan'),
    ('Catigan', 2, 'Toril College'),
    ('Catigan', 3, 'Pepsi Cola Bottling'),
    ('Catigan', 4, 'DepEd School Building'),
    ('Catigan', 5, 'Ulas Crossing')
) AS seq(route_name, seq, stop_name)
    ON r.name = seq.route_name
JOIN stops s ON s.name = seq.stop_name;

-- Catigan distances
INSERT INTO distances (route_id, origin_stop_id, destination_stop_id, distance_km)
SELECT r.id, s1.id, s2.id, d.dist
FROM routes r
JOIN (VALUES
    ('Catigan', 'Catigan', 'Toril College', 1.1),
    ('Catigan', 'Toril College', 'Pepsi Cola Bottling', 0.8),
    ('Catigan', 'Pepsi Cola Bottling', 'DepEd School Building', 0.7),
    ('Catigan', 'DepEd School Building', 'Ulas Crossing', 0.9)
) AS d(route_name, origin, dest, dist)
    ON r.name = d.route_name
JOIN stops s1 ON s1.name = d.origin
JOIN stops s2 ON s2.name = d.dest;

-- Catitipan via Dacudao route_stops
INSERT INTO route_stops (route_id, stop_id, sequence_number)
SELECT r.id, s.id, seq.seq
FROM routes r
JOIN (VALUES
    ('Catitipan via Dacudao', 1, 'Catitipan'),
    ('Catitipan via Dacudao', 2, 'Dacudao Fly Over'),
    ('Catitipan via Dacudao', 3, 'China Bank (near EMCOR Bajada)'),
    ('Catitipan via Dacudao', 4, 'V. Mapa St (Bajada)'),
    ('Catitipan via Dacudao', 5, 'Phil Post Office'),
    ('Catitipan via Dacudao', 6, 'Old Recto / Palma Gil'),
    ('Catitipan via Dacudao', 7, 'Ilustre')
) AS seq(route_name, seq, stop_name)
    ON r.name = seq.route_name
JOIN stops s ON s.name = seq.stop_name;

-- Catitipan via Dacudao distances
INSERT INTO distances (route_id, origin_stop_id, destination_stop_id, distance_km)
SELECT r.id, s1.id, s2.id, d.dist
FROM routes r
JOIN (VALUES
    ('Catitipan via Dacudao', 'Catitipan', 'Dacudao Fly Over', 1.1),
    ('Catitipan via Dacudao', 'Dacudao Fly Over', 'China Bank (near EMCOR Bajada)', 0.8),
    ('Catitipan via Dacudao', 'China Bank (near EMCOR Bajada)', 'V. Mapa St (Bajada)', 0.7),
    ('Catitipan via Dacudao', 'V. Mapa St (Bajada)', 'Phil Post Office', 0.9),
    ('Catitipan via Dacudao', 'Phil Post Office', 'Old Recto / Palma Gil', 1.0),
    ('Catitipan via Dacudao', 'Old Recto / Palma Gil', 'Ilustre', 0.8)
) AS d(route_name, origin, dest, dist)
    ON r.name = d.route_name
JOIN stops s1 ON s1.name = d.origin
JOIN stops s2 ON s2.name = d.dest;

-- Communal / Country Homes route_stops
INSERT INTO route_stops (route_id, stop_id, sequence_number)
SELECT r.id, s.id, seq.seq
FROM routes r
JOIN (VALUES
    ('Communal / Country Homes', 1, 'Communal'),
    ('Communal / Country Homes', 2, 'Country Homes'),
    ('Communal / Country Homes', 3, 'V. Mapa St (Bajada)'),
    ('Communal / Country Homes', 4, 'Phil Post Office'),
    ('Communal / Country Homes', 5, 'Old Recto / Palma Gil'),
    ('Communal / Country Homes', 6, 'Ilustre')
) AS seq(route_name, seq, stop_name)
    ON r.name = seq.route_name
JOIN stops s ON s.name = seq.stop_name;

-- Communal / Country Homes distances
INSERT INTO distances (route_id, origin_stop_id, destination_stop_id, distance_km)
SELECT r.id, s1.id, s2.id, d.dist
FROM routes r
JOIN (VALUES
    ('Communal / Country Homes', 'Communal', 'Country Homes', 1.0),
    ('Communal / Country Homes', 'Country Homes', 'V. Mapa St (Bajada)', 0.8),
    ('Communal / Country Homes', 'V. Mapa St (Bajada)', 'Phil Post Office', 0.7),
    ('Communal / Country Homes', 'Phil Post Office', 'Old Recto / Palma Gil', 0.9),
    ('Communal / Country Homes', 'Old Recto / Palma Gil', 'Ilustre', 1.0)
) AS d(route_name, origin, dest, dist)
    ON r.name = d.route_name
JOIN stops s1 ON s1.name = d.origin
JOIN stops s2 ON s2.name = d.dest;

-- Dacoville route_stops
INSERT INTO route_stops (route_id, stop_id, sequence_number)
SELECT r.id, s.id, seq.seq
FROM routes r
JOIN (VALUES
    ('Dacoville', 1, 'Dacoville'),
    ('Dacoville', 2, 'V. Mapa St (Bajada)'),
    ('Dacoville', 3, 'Phil Post Office'),
    ('Dacoville', 4, 'Old Recto / Palma Gil'),
    ('Dacoville', 5, 'Ilustre')
) AS seq(route_name, seq, stop_name)
    ON r.name = seq.route_name
JOIN stops s ON s.name = seq.stop_name;

-- Dacoville distances
INSERT INTO distances (route_id, origin_stop_id, destination_stop_id, distance_km)
SELECT r.id, s1.id, s2.id, d.dist
FROM routes r
JOIN (VALUES
    ('Dacoville', 'Dacoville', 'V. Mapa St (Bajada)', 0.8),
    ('Dacoville', 'V. Mapa St (Bajada)', 'Phil Post Office', 0.7),
    ('Dacoville', 'Phil Post Office', 'Old Recto / Palma Gil', 0.9),
    ('Dacoville', 'Old Recto / Palma Gil', 'Ilustre', 1.0)
) AS d(route_name, origin, dest, dist)
    ON r.name = d.route_name
JOIN stops s1 ON s1.name = d.origin
JOIN stops s2 ON s2.name = d.dest;

-- Darong Route route_stops
INSERT INTO route_stops (route_id, stop_id, sequence_number)
SELECT r.id, s.id, seq.seq
FROM routes r
JOIN (VALUES
    ('Darong Route', 1, 'Darong'),
    ('Darong Route', 2, 'V. Mapa St (Bajada)'),
    ('Darong Route', 3, 'Phil Post Office'),
    ('Darong Route', 4, 'Old Recto / Palma Gil'),
    ('Darong Route', 5, 'Ilustre')
) AS seq(route_name, seq, stop_name)
    ON r.name = seq.route_name
JOIN stops s ON s.name = seq.stop_name;

-- Darong Route distances
INSERT INTO distances (route_id, origin_stop_id, destination_stop_id, distance_km)
SELECT r.id, s1.id, s2.id, d.dist
FROM routes r
JOIN (VALUES
    ('Darong Route', 'Darong', 'V. Mapa St (Bajada)', 0.8),
    ('Darong Route', 'V. Mapa St (Bajada)', 'Phil Post Office', 0.7),
    ('Darong Route', 'Phil Post Office', 'Old Recto / Palma Gil', 0.9),
    ('Darong Route', 'Old Recto / Palma Gil', 'Ilustre', 1.0)
) AS d(route_name, origin, dest, dist)
    ON r.name = d.route_name
JOIN stops s1 ON s1.name = d.origin
JOIN stops s2 ON s2.name = d.dest;

-- Cabantian route_stops
INSERT INTO route_stops (route_id, stop_id, sequence_number)
SELECT r.id, s.id, seq.seq
FROM routes r
JOIN (VALUES
    ('Cabantian', 1, 'Cabantian'),
    ('Cabantian', 2, 'V. Mapa St (Bajada)'),
    ('Cabantian', 3, 'Phil Post Office'),
    ('Cabantian', 4, 'Old Recto / Palma Gil'),
    ('Cabantian', 5, 'Ilustre')
) AS seq(route_name, seq, stop_name)
    ON r.name = seq.route_name
JOIN stops s ON s.name = seq.stop_name;

-- Cabantian distances
INSERT INTO distances (route_id, origin_stop_id, destination_stop_id, distance_km)
SELECT r.id, s1.id, s2.id, d.dist
FROM routes r
JOIN (VALUES
    ('Cabantian', 'Cabantian', 'V. Mapa St (Bajada)', 0.8),
    ('Cabantian', 'V. Mapa St (Bajada)', 'Phil Post Office', 0.7),
    ('Cabantian', 'Phil Post Office', 'Old Recto / Palma Gil', 0.9),
    ('Cabantian', 'Old Recto / Palma Gil', 'Ilustre', 1.0)
) AS d(route_name, origin, dest, dist)
    ON r.name = d.route_name
JOIN stops s1 ON s1.name = d.origin
JOIN stops s2 ON s2.name = d.dest;

-- Bangkal route_stops
INSERT INTO route_stops (route_id, stop_id, sequence_number)
SELECT r.id, s.id, seq.seq
FROM routes r
JOIN (VALUES
    ('Bangkal', 1, 'Bangkal Valley, HTS'),
    ('Bangkal', 2, 'Royal Valley Bangkal'),
    ('Bangkal', 3, 'Boundary Malita-Talomo'),
    ('Bangkal', 4, 'Libby Crossing'),
    ('Bangkal', 5, 'Ulas Crossing'),
    ('Bangkal', 6, 'DepEd School Building'),
    ('Bangkal', 7, 'Pepsi Cola Bottling'),
    ('Bangkal', 8, 'Toril College'),
    ('Bangkal', 9, 'Libby-Lubogan JCT'),
    ('Bangkal', 10, 'Sta. Cruz Chapel, Bangkas HTS'),
    ('Bangkal', 11, 'Purok 5'),
    ('Bangkal', 12, 'Mulig Elem. School')
) AS seq(route_name, seq, stop_name)
    ON r.name = seq.route_name
JOIN stops s ON s.name = seq.stop_name;

-- Bangkal distances
INSERT INTO distances (route_id, origin_stop_id, destination_stop_id, distance_km)
SELECT r.id, s1.id, s2.id, d.dist
FROM routes r
JOIN (VALUES
    ('Bangkal', 'Bangkal Valley, HTS', 'Royal Valley Bangkal', 0.8),
    ('Bangkal', 'Royal Valley Bangkal', 'Boundary Malita-Talomo', 0.7),
    ('Bangkal', 'Boundary Malita-Talomo', 'Libby Crossing', 0.9),
    ('Bangkal', 'Libby Crossing', 'Ulas Crossing', 1.0),
    ('Bangkal', 'Ulas Crossing', 'DepEd School Building', 0.8),
    ('Bangkal', 'DepEd School Building', 'Pepsi Cola Bottling', 0.7),
    ('Bangkal', 'Pepsi Cola Bottling', 'Toril College', 0.9),
    ('Bangkal', 'Toril College', 'Libby-Lubogan JCT', 1.0),
    ('Bangkal', 'Libby-Lubogan JCT', 'Sta. Cruz Chapel, Bangkas HTS', 0.8),
    ('Bangkal', 'Sta. Cruz Chapel, Bangkas HTS', 'Purok 5', 0.7),
    ('Bangkal', 'Purok 5', 'Mulig Elem. School', 0.9)
) AS d(route_name, origin, dest, dist)
    ON r.name = d.route_name
JOIN stops s1 ON s1.name = d.origin
JOIN stops s2 ON s2.name = d.dest;

-- Bago Aplaya route_stops
INSERT INTO route_stops (route_id, stop_id, sequence_number)
SELECT r.id, s.id, seq.seq
FROM routes r
JOIN (VALUES
    ('Bago Aplaya', 1, 'Bago Aplaya'),
    ('Bago Aplaya', 2, 'Matina Aplaya'),
    ('Bago Aplaya', 3, 'Matina Health Center'),
    ('Bago Aplaya', 4, 'Matina Gym'),
    ('Bago Aplaya', 5, 'Matina High School'),
    ('Bago Aplaya', 6, 'Matina Elementary School'),
    ('Bago Aplaya', 7, 'Matina Shrine'),
    ('Bago Aplaya', 8, 'Matina Town Square'),
    ('Bago Aplaya', 9, 'Matina Public Market'),
    ('Bago Aplaya', 10, 'Matina Crossing'),
    ('Bago Aplaya', 11, 'Matina Pangi')
) AS seq(route_name, seq, stop_name)
    ON r.name = seq.route_name
JOIN stops s ON s.name = seq.stop_name;

-- Bago Aplaya distances
INSERT INTO distances (route_id, origin_stop_id, destination_stop_id, distance_km)
SELECT r.id, s1.id, s2.id, d.dist
FROM routes r
JOIN (VALUES
    ('Bago Aplaya', 'Bago Aplaya', 'Matina Aplaya', 0.8),
    ('Bago Aplaya', 'Matina Aplaya', 'Matina Health Center', 0.7),
    ('Bago Aplaya', 'Matina Health Center', 'Matina Gym', 0.6),
    ('Bago Aplaya', 'Matina Gym', 'Matina High School', 0.7),
    ('Bago Aplaya', 'Matina High School', 'Matina Elementary School', 0.8),
    ('Bago Aplaya', 'Matina Elementary School', 'Matina Shrine', 0.6),
    ('Bago Aplaya', 'Matina Shrine', 'Matina Town Square', 0.7),
    ('Bago Aplaya', 'Matina Town Square', 'Matina Public Market', 0.8),
    ('Bago Aplaya', 'Matina Public Market', 'Matina Crossing', 0.6),
    ('Bago Aplaya', 'Matina Crossing', 'Matina Pangi', 0.7)
) AS d(route_name, origin, dest, dist)
    ON r.name = d.route_name
JOIN stops s1 ON s1.name = d.origin
JOIN stops s2 ON s2.name = d.dest;

-- Acacia-Indangan-Mahayag route_stops
INSERT INTO route_stops (route_id, stop_id, sequence_number)
SELECT r.id, s.id, seq.seq
FROM routes r
JOIN (VALUES
    ('Acacia-Indangan-Mahayag', 1, 'Acacia'),
    ('Acacia-Indangan-Mahayag', 2, 'Indangan'),
    ('Acacia-Indangan-Mahayag', 3, 'Mahayag'),
    ('Acacia-Indangan-Mahayag', 4, 'Mahayag RMTG'),
    ('Acacia-Indangan-Mahayag', 5, 'Davao Extension Lumber'),
    ('Acacia-Indangan-Mahayag', 6, 'Tibungco Elem. School'),
    ('Acacia-Indangan-Mahayag', 7, 'Ugy. College (Buhangin)'),
    ('Acacia-Indangan-Mahayag', 8, 'Bury, Ibanga Basketball Court'),
    ('Acacia-Indangan-Mahayag', 9, 'Bacantan'),
    ('Acacia-Indangan-Mahayag', 10, 'Panacan Public Market')
) AS seq(route_name, seq, stop_name)
    ON r.name = seq.route_name
JOIN stops s ON s.name = seq.stop_name;

-- Acacia-Indangan-Mahayag distances
INSERT INTO distances (route_id, origin_stop_id, destination_stop_id, distance_km)
SELECT r.id, s1.id, s2.id, d.dist
FROM routes r
JOIN (VALUES
    ('Acacia-Indangan-Mahayag', 'Acacia', 'Indangan', 1.0),
    ('Acacia-Indangan-Mahayag', 'Indangan', 'Mahayag', 0.8),
    ('Acacia-Indangan-Mahayag', 'Mahayag', 'Mahayag RMTG', 0.7),
    ('Acacia-Indangan-Mahayag', 'Mahayag RMTG', 'Davao Extension Lumber', 0.9),
    ('Acacia-Indangan-Mahayag', 'Davao Extension Lumber', 'Tibungco Elem. School', 1.0),
    ('Acacia-Indangan-Mahayag', 'Tibungco Elem. School', 'Ugy. College (Buhangin)', 0.8),
    ('Acacia-Indangan-Mahayag', 'Ugy. College (Buhangin)', 'Bury, Ibanga Basketball Court', 0.7),
    ('Acacia-Indangan-Mahayag', 'Bury, Ibanga Basketball Court', 'Bacantan', 0.9),
    ('Acacia-Indangan-Mahayag', 'Bacantan', 'Panacan Public Market', 1.0)
) AS d(route_name, origin, dest, dist)
    ON r.name = d.route_name
JOIN stops s1 ON s1.name = d.origin
JOIN stops s2 ON s2.name = d.dest;

-- Panacan – SM City Route route_stops
INSERT INTO route_stops (route_id, stop_id, sequence_number)
SELECT r.id, s.id, seq.seq
FROM routes r
JOIN (VALUES
    ('Panacan – SM City Route', 1, 'Panacan Public Market'),
    ('Panacan – SM City Route', 2, 'Sagrada Familia St. (Km. 13)'),
    ('Panacan – SM City Route', 3, 'Going to Babak'),
    ('Panacan – SM City Route', 4, 'Marigold Wharf'),
    ('Panacan – SM City Route', 5, 'Old Crossing Airport Road'),
    ('Panacan – SM City Route', 6, 'Hizon Elem. School'),
    ('Panacan – SM City Route', 7, 'Alcantra & Sons'),
    ('Panacan – SM City Route', 8, 'Damosa'),
    ('Panacan – SM City Route', 9, 'Alatade General Hospital'),
    ('Panacan – SM City Route', 10, 'Crossing Ulas'),
    ('Panacan – SM City Route', 11, 'Ecoland Terminal'),
    ('Panacan – SM City Route', 12, 'SM City Davao')
) AS seq(route_name, seq, stop_name)
    ON r.name = seq.route_name
JOIN stops s ON s.name = seq.stop_name;

-- Panacan – SM City Route distances
INSERT INTO distances (route_id, origin_stop_id, destination_stop_id, distance_km)
SELECT r.id, s1.id, s2.id, d.dist
FROM routes r
JOIN (VALUES
    ('Panacan – SM City Route', 'Panacan Public Market', 'Sagrada Familia St. (Km. 13)', 1.0),
    ('Panacan – SM City Route', 'Sagrada Familia St. (Km. 13)', 'Going to Babak', 0.9),
    ('Panacan – SM City Route', 'Going to Babak', 'Marigold Wharf', 1.1),
    ('Panacan – SM City Route', 'Marigold Wharf', 'Old Crossing Airport Road', 0.8),
    ('Panacan – SM City Route', 'Old Crossing Airport Road', 'Hizon Elem. School', 1.0),
    ('Panacan – SM City Route', 'Hizon Elem. School', 'Alcantra & Sons', 0.9),
    ('Panacan – SM City Route', 'Alcantra & Sons', 'Damosa', 1.1),
    ('Panacan – SM City Route', 'Damosa', 'Alatade General Hospital', 0.8),
    ('Panacan – SM City Route', 'Alatade General Hospital', 'Crossing Ulas', 1.0),
    ('Panacan – SM City Route', 'Crossing Ulas', 'Ecoland Terminal', 1.2),
    ('Panacan – SM City Route', 'Ecoland Terminal', 'SM City Davao', 1.0)
) AS d(route_name, origin, dest, dist)
    ON r.name = d.route_name
JOIN stops s1 ON s1.name = d.origin
JOIN stops s2 ON s2.name = d.dest;