-- Create stops table to store all unique stops
CREATE TABLE IF NOT EXISTS stops (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create routes table to store route information
CREATE TABLE IF NOT EXISTS routes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create route_stops table to store the sequence of stops in each route
CREATE TABLE IF NOT EXISTS route_stops (
    id SERIAL PRIMARY KEY,
    route_id INTEGER REFERENCES routes(id),
    stop_id INTEGER REFERENCES stops(id),
    sequence_number INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(route_id, stop_id, sequence_number)
);

-- Create distances table to store distances between stops
CREATE TABLE IF NOT EXISTS distances (
    id SERIAL PRIMARY KEY,
    route_id INTEGER REFERENCES routes(id),
    origin_stop_id INTEGER REFERENCES stops(id),
    destination_stop_id INTEGER REFERENCES stops(id),
    distance_km DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(route_id, origin_stop_id, destination_stop_id)
);

