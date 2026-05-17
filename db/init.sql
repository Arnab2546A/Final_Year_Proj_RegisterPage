-- Basic schema for the registration app
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(50) NOT NULL,
  usb_vid VARCHAR(10) UNIQUE NOT NULL,
  usb_pid VARCHAR(10) UNIQUE NOT NULL,
  public_key_pem TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
