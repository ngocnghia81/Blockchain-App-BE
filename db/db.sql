CREATE DATABASE BlockChain;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE, 
    commonName VARCHAR(255),
    organization VARCHAR(255),
    organizationalUnit VARCHAR(255),
    country VARCHAR(255),
    state VARCHAR(255),
    locality VARCHAR(255),
    certificate TEXT,
    public_key BLOB,
    private_key BLOB,
    enrollment_secret VARCHAR(255),
    citizen_id VARCHAR(12) NOT NULL UNIQUE,
    pin_code CHAR(6) DEFAULT NULL,
    CHECK (pin_code REGEXP '^[0-9]{6}$' OR pin_code IS NULL) 
);
