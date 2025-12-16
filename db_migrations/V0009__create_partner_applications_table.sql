-- Create partner_applications table
CREATE TABLE IF NOT EXISTS partner_applications (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    organization VARCHAR(255),
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on category for faster filtering
CREATE INDEX idx_partner_applications_category ON partner_applications(category);

-- Create index on status for faster filtering
CREATE INDEX idx_partner_applications_status ON partner_applications(status);

-- Create index on created_at for sorting
CREATE INDEX idx_partner_applications_created_at ON partner_applications(created_at DESC);