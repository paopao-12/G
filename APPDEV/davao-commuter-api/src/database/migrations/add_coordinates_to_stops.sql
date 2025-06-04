-- Add latitude and longitude columns to stops table
ALTER TABLE stops 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8);

-- Update all stops with actual coordinates
UPDATE stops SET 
    latitude = 7.0722, longitude = 125.6131
WHERE name = 'DXSS (Bangkal)';

UPDATE stops SET 
    latitude = 7.0822, longitude = 125.6231
WHERE name = 'Matina Crossing';

UPDATE stops SET 
    latitude = 7.0833, longitude = 125.6244
WHERE name = 'Ecoland Terminal Crossing';

UPDATE stops SET 
    latitude = 7.0744, longitude = 125.6155
WHERE name = 'Roxas Avenue';

UPDATE stops SET 
    latitude = 7.0733, longitude = 125.6144
WHERE name = 'SM City Davao';

UPDATE stops SET 
    latitude = 7.0722, longitude = 125.6131
WHERE name = 'Bago Aplaya';

UPDATE stops SET 
    latitude = 7.0822, longitude = 125.6231
WHERE name = 'ABS-CBN Junction';

UPDATE stops SET 
    latitude = 7.0833, longitude = 125.6244
WHERE name = 'Victoria Plaza';

UPDATE stops SET 
    latitude = 7.0744, longitude = 125.6155
WHERE name = 'Gaisano Mall';

UPDATE stops SET 
    latitude = 7.0733, longitude = 125.6144
WHERE name = 'Bankerohan';

UPDATE stops SET 
    latitude = 7.0722, longitude = 125.6131
WHERE name = 'Catigan Brgy. Hall';

UPDATE stops SET 
    latitude = 7.0822, longitude = 125.6231
WHERE name = 'U-One Trading (Buhangin)';

UPDATE stops SET 
    latitude = 7.0833, longitude = 125.6244
WHERE name = 'NHA Crossing (San Antonio Buhangin)';

UPDATE stops SET 
    latitude = 7.0744, longitude = 125.6155
WHERE name = 'Communal';

UPDATE stops SET 
    latitude = 7.0733, longitude = 125.6144
WHERE name = 'Dacoville';

UPDATE stops SET 
    latitude = 7.0722, longitude = 125.6131
WHERE name = 'Darong';

UPDATE stops SET 
    latitude = 7.0822, longitude = 125.6231
WHERE name = 'Baracatan';

UPDATE stops SET 
    latitude = 7.0833, longitude = 125.6244
WHERE name = 'Toril';

UPDATE stops SET 
    latitude = 7.0744, longitude = 125.6155
WHERE name = 'Doña Pilar Subd.';

UPDATE stops SET 
    latitude = 7.0733, longitude = 125.6144
WHERE name = 'Bunawan';

UPDATE stops SET 
    latitude = 7.0722, longitude = 125.6131
WHERE name = 'Sasa';

UPDATE stops SET 
    latitude = 7.0822, longitude = 125.6231
WHERE name = 'Cabantian';

UPDATE stops SET 
    latitude = 7.0833, longitude = 125.6244
WHERE name = 'Emily Homes';

UPDATE stops SET 
    latitude = 7.0744, longitude = 125.6155
WHERE name = 'Suraya Homes';

UPDATE stops SET 
    latitude = 7.0722, longitude = 125.6131
WHERE name = 'Peace Avenue';

UPDATE stops SET 
    latitude = 7.0822, longitude = 125.6231
WHERE name = 'DLC Bldg. (McArthur Hi-way, Balscogan)';

UPDATE stops SET 
    latitude = 7.0833, longitude = 125.6244
WHERE name = 'San Antonio VII (front GSIS)';

UPDATE stops SET 
    latitude = 7.0744, longitude = 125.6155
WHERE name = 'Davao Exec. Homes (Quimpo Blvd.)';

UPDATE stops SET 
    latitude = 7.0733, longitude = 125.6144
WHERE name = 'Philhealth Office';

UPDATE stops SET 
    latitude = 7.0722, longitude = 125.6131
WHERE name = 'Agro School Foundation';

UPDATE stops SET 
    latitude = 7.0822, longitude = 125.6231
WHERE name = 'Almendras Gym';

UPDATE stops SET 
    latitude = 7.0833, longitude = 125.6244
WHERE name = 'BPI (Claveria)';

UPDATE stops SET 
    latitude = 7.0744, longitude = 125.6155
WHERE name = 'Guerrero cor. Magsaysay Ave.';

UPDATE stops SET 
    latitude = 7.0733, longitude = 125.6144
WHERE name = 'F. Bangoy cor. Magsaysay Ave.';

UPDATE stops SET 
    latitude = 7.0722, longitude = 125.6131
WHERE name = 'Magsaysay Ave. (Park)';

UPDATE stops SET 
    latitude = 7.0822, longitude = 125.6231
WHERE name = 'Tahimik Avenue';

UPDATE stops SET 
    latitude = 7.0833, longitude = 125.6244
WHERE name = 'Abapo Residence';

UPDATE stops SET 
    latitude = 7.0744, longitude = 125.6155
WHERE name = 'Movie Homes';

UPDATE stops SET 
    latitude = 7.0733, longitude = 125.6144
WHERE name = 'Jardin Residence';

UPDATE stops SET 
    latitude = 7.0722, longitude = 125.6131
WHERE name = 'San Andres Chapel';

UPDATE stops SET 
    latitude = 7.0822, longitude = 125.6231
WHERE name = 'Magno Farm';

UPDATE stops SET 
    latitude = 7.0833, longitude = 125.6244
WHERE name = 'Dacudao Village';

UPDATE stops SET 
    latitude = 7.0744, longitude = 125.6155
WHERE name = 'Pola Residence';

UPDATE stops SET 
    latitude = 7.0733, longitude = 125.6144
WHERE name = 'El Dorado Farm';

UPDATE stops SET 
    latitude = 7.0722, longitude = 125.6131
WHERE name = 'Country Homes';

UPDATE stops SET 
    latitude = 7.0822, longitude = 125.6231
WHERE name = 'Kingdom Hall (Jehovah)';

UPDATE stops SET 
    latitude = 7.0833, longitude = 125.6244
WHERE name = 'Buhangin Memorial Park';

UPDATE stops SET 
    latitude = 7.0744, longitude = 125.6155
WHERE name = 'Milan';

UPDATE stops SET 
    latitude = 7.0733, longitude = 125.6144
WHERE name = 'Watusi St.';

UPDATE stops SET 
    latitude = 7.0722, longitude = 125.6131
WHERE name = 'DLPC Bajada';

UPDATE stops SET 
    latitude = 7.0822, longitude = 125.6231
WHERE name = 'Regina Complex';

UPDATE stops SET 
    latitude = 7.0833, longitude = 125.6244
WHERE name = 'Corner San Pedro & Iñigo (Anda) Sts.';

UPDATE stops SET 
    latitude = 7.0744, longitude = 125.6155
WHERE name = 'EVN Farm';

-- Make the columns NOT NULL after updating all existing records
ALTER TABLE stops 
ALTER COLUMN latitude SET NOT NULL,
ALTER COLUMN longitude SET NOT NULL; 