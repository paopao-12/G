-- Create route_metrics table for historical data
CREATE TABLE route_metrics (
    id SERIAL PRIMARY KEY,
    route_id INTEGER REFERENCES routes(id),
    date DATE NOT NULL,
    hour INTEGER NOT NULL,
    estimated_travel_time INTEGER NOT NULL, -- in minutes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create route_safety table
CREATE TABLE route_safety (
    id SERIAL PRIMARY KEY,
    route_id INTEGER REFERENCES routes(id),
    safety_score DECIMAL(3,2) NOT NULL,
    last_incident_date DATE,
    incident_count INTEGER DEFAULT 0,
    police_presence BOOLEAN DEFAULT false,
    well_lit BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create route_accessibility table
CREATE TABLE route_accessibility (
    id SERIAL PRIMARY KEY,
    route_id INTEGER REFERENCES routes(id),
    wheelchair_accessible BOOLEAN DEFAULT false,
    has_elevator BOOLEAN DEFAULT false,
    has_escalator BOOLEAN DEFAULT false,
    has_stairs BOOLEAN DEFAULT true,
    ramp_available BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create route_schedule table
CREATE TABLE route_schedule (
    id SERIAL PRIMARY KEY,
    route_id INTEGER REFERENCES routes(id),
    day_of_week INTEGER NOT NULL, -- 0-6 (Sunday-Saturday)
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    frequency INTEGER NOT NULL, -- minutes between jeepneys
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create route_alternatives table
CREATE TABLE route_alternatives (
    id SERIAL PRIMARY KEY,
    route_id INTEGER REFERENCES routes(id),
    alternative_route_id INTEGER REFERENCES routes(id),
    walking_distance INTEGER NOT NULL, -- in meters
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create stop_accessibility table
CREATE TABLE stop_accessibility (
    id SERIAL PRIMARY KEY,
    stop_id INTEGER REFERENCES stops(id),
    wheelchair_accessible BOOLEAN DEFAULT false,
    has_elevator BOOLEAN DEFAULT false,
    has_escalator BOOLEAN DEFAULT false,
    has_stairs BOOLEAN DEFAULT true,
    ramp_available BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create route_crowd_patterns table
CREATE TABLE route_crowd_patterns (
    id SERIAL PRIMARY KEY,
    route_id INTEGER REFERENCES routes(id),
    day_of_week INTEGER NOT NULL, -- 0-6 (Sunday-Saturday)
    hour INTEGER NOT NULL, -- 0-23
    average_crowd_level DECIMAL(3,2) NOT NULL, -- 0-1 scale
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_route_metrics_route_date ON route_metrics(route_id, date);
CREATE INDEX idx_route_safety_route ON route_safety(route_id);
CREATE INDEX idx_route_accessibility_route ON route_accessibility(route_id);
CREATE INDEX idx_route_schedule_route ON route_schedule(route_id, day_of_week);
CREATE INDEX idx_route_alternatives_route ON route_alternatives(route_id);
CREATE INDEX idx_stop_accessibility_stop ON stop_accessibility(stop_id);
CREATE INDEX idx_route_crowd_patterns_route ON route_crowd_patterns(route_id, day_of_week, hour); 