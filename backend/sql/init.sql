-- Krishi Raksha AI: PostgreSQL Initialization
-- TimescaleDB extension and hypertable setup

CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create TimescaleDB hypertable for weather_snapshots (after table creation by SQLAlchemy)
-- This is handled in a post-migration step
