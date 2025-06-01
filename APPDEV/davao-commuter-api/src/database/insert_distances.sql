-- Insert distances data
-- Bangkal Route distances
INSERT INTO distances (route_id, origin_stop_id, destination_stop_id, distance_km) VALUES
(1, 1, 2, 1.0),   -- Peace Avenue to DLC Bldg.
(1, 2, 3, 0.5),   -- DLC Bldg. to San Antonio VII
(1, 3, 4, 0.8),   -- San Antonio VII to Davao Exec. Homes
(1, 4, 5, 1.2),   -- Davao Exec. Homes to SM City Davao
(1, 5, 6, 0.7),   -- SM City Davao to Philhealth Office
(1, 6, 7, 0.6),   -- Philhealth Office to Agro School Foundation
(1, 7, 8, 0.9),   -- Agro School Foundation to Almendras Gym
(1, 8, 9, 0.8),   -- Almendras Gym to BPI (Claveria)
(1, 9, 10, 0.7),  -- BPI to Guerrero cor. Magsaysay Ave.
(1, 10, 11, 0.6), -- Guerrero to F. Bangoy cor. Magsaysay Ave.
(1, 11, 12, 0.5), -- F. Bangoy to Magsaysay Ave. (Park)
(1, 12, 13, 1.0), -- Magsaysay Ave. (Park) to Bago Aplaya
(1, 13, 14, 0.8); -- Bago Aplaya to DXSS (Bangkal)

-- Bago Aplaya Route distances
INSERT INTO distances (route_id, origin_stop_id, destination_stop_id, distance_km) VALUES
(2, 13, 15, 0.8),  -- Bago Aplaya to Tahimik Avenue
(2, 15, 16, 0.7),  -- Tahimik Avenue to Matina Crossing
(2, 16, 17, 0.9),  -- Matina Crossing to ABS-CBN Junction
(2, 17, 18, 1.0),  -- ABS-CBN Junction to Ecoland Terminal Crossing
(2, 18, 19, 0.8),  -- Ecoland Terminal Crossing to Roxas Avenue
(2, 19, 20, 0.7),  -- Roxas Avenue to Abapo Residence
(2, 20, 21, 0.6),  -- Abapo Residence to Movie Homes
(2, 21, 22, 0.8),  -- Movie Homes to Jardin Residence
(2, 22, 23, 0.9),  -- Jardin Residence to San Andres Chapel
(2, 23, 24, 1.0),  -- San Andres Chapel to Magno Farm
(2, 24, 25, 0.8),  -- Magno Farm to Dacudao Village
(2, 25, 26, 0.7),  -- Dacudao Village to Pola Residence
(2, 26, 27, 0.9),  -- Pola Residence to El Dorado Farm
(2, 27, 28, 1.0),  -- El Dorado Farm to Country Homes
(2, 28, 29, 0.8),  -- Country Homes to Kingdom Hall
(2, 29, 30, 0.7),  -- Kingdom Hall to Buhangin Memorial Park
(2, 30, 31, 0.6),  -- Buhangin Memorial Park to Milan
(2, 31, 32, 0.8),  -- Milan to Watusi St.
(2, 32, 33, 0.9),  -- Watusi St. to DLPC Bajada
(2, 33, 34, 1.0),  -- DLPC Bajada to Victoria Plaza
(2, 34, 35, 0.8),  -- Victoria Plaza to Gaisano Mall
(2, 35, 36, 0.7),  -- Gaisano Mall to Regina Complex
(2, 36, 37, 0.6),  -- Regina Complex to Corner San Pedro & Iñigo
(2, 37, 38, 0.8);  -- Corner San Pedro & Iñigo to Bankerohan

-- Communal / Country Homes Route distances
INSERT INTO distances (route_id, origin_stop_id, destination_stop_id, distance_km) VALUES
(7, 43, 28, 1.2),  -- Communal to Country Homes
(7, 28, 29, 0.8),  -- Country Homes to Kingdom Hall
(7, 29, 30, 0.7),  -- Kingdom Hall to Buhangin Memorial Park
(7, 30, 31, 0.6),  -- Buhangin Memorial Park to Milan
(7, 31, 32, 0.8),  -- Milan to Watusi St.
(7, 32, 33, 0.9),  -- Watusi St. to DLPC Bajada
(7, 33, 34, 1.0),  -- DLPC Bajada to Victoria Plaza
(7, 34, 35, 0.8),  -- Victoria Plaza to Gaisano Mall
(7, 35, 36, 0.7),  -- Gaisano Mall to Regina Complex
(7, 36, 37, 0.6),  -- Regina Complex to Corner San Pedro & Iñigo
(7, 37, 38, 0.8);  -- Corner San Pedro & Iñigo to Bankerohan

-- Dacoville Route distances
INSERT INTO distances (route_id, origin_stop_id, destination_stop_id, distance_km) VALUES
(8, 44, 39, 1.2),  -- Dacoville to Catigan Brgy. Hall
(8, 39, 40, 0.8),  -- Catigan Brgy. Hall to EVN Farm
(8, 40, 41, 0.7),  -- EVN Farm to U-One Trading
(8, 41, 42, 0.6),  -- U-One Trading to NHA Crossing
(8, 42, 30, 0.8),  -- NHA Crossing to Buhangin Memorial Park
(8, 30, 31, 0.7),  -- Buhangin Memorial Park to Milan
(8, 31, 32, 0.6),  -- Milan to Watusi St.
(8, 32, 33, 0.8),  -- Watusi St. to DLPC Bajada
(8, 33, 34, 0.9),  -- DLPC Bajada to Victoria Plaza
(8, 34, 35, 1.0),  -- Victoria Plaza to Gaisano Mall
(8, 35, 36, 0.8),  -- Gaisano Mall to Regina Complex
(8, 36, 37, 0.7),  -- Regina Complex to Corner San Pedro & Iñigo
(8, 37, 38, 0.6);  -- Corner San Pedro & Iñigo to Bankerohan

-- Darong Route distances
INSERT INTO distances (route_id, origin_stop_id, destination_stop_id, distance_km) VALUES
(9, 45, 46, 1.2),  -- Darong to Baracatan
(9, 46, 47, 0.8),  -- Baracatan to Toril
(9, 47, 48, 0.7),  -- Toril to Doña Pilar Subd.
(9, 48, 49, 0.6),  -- Doña Pilar Subd. to Bunawan
(9, 49, 50, 0.8),  -- Bunawan to Sasa
(9, 50, 51, 0.9),  -- Sasa to Cabantian
(9, 51, 52, 1.0),  -- Cabantian to Emily Homes
(9, 52, 53, 0.8);  -- Emily Homes to Suraya Homes 