-- Create requests table to store patient requests
CREATE TABLE IF NOT EXISTS requests (
  id SERIAL PRIMARY KEY,
  patient_name VARCHAR(255) NOT NULL,
  patient_cnp VARCHAR(13) NOT NULL,
  patient_birth_date VARCHAR(10) NOT NULL,
  patient_citizenship VARCHAR(100) NOT NULL,
  patient_address_street VARCHAR(255) NOT NULL,
  patient_address_number VARCHAR(50),
  patient_address_block VARCHAR(50),
  patient_address_entrance VARCHAR(50),
  patient_address_apartment VARCHAR(50),
  patient_address_sector VARCHAR(100) NOT NULL,
  patient_id_type VARCHAR(100) NOT NULL,
  patient_id_series VARCHAR(50) NOT NULL,
  patient_id_number VARCHAR(50) NOT NULL,
  patient_id_issued_by VARCHAR(255) NOT NULL,
  patient_id_issue_date VARCHAR(10) NOT NULL,
  doctor_name VARCHAR(255) NOT NULL,
  doctor_specialty VARCHAR(255),
  pdf_data BYTEA NOT NULL,
  signature_data_url TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on patient CNP for faster lookups
CREATE INDEX IF NOT EXISTS idx_requests_cnp ON requests(patient_cnp);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at DESC);

