CREATE DATABASE degree_verification;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE, 
    citizen_id VARCHAR(12) NOT NULL UNIQUE CHECK (LENGTH(citizen_id) = 12 AND citizen_id REGEXP '^[0-9]+$'),    
    role ENUM('student', 'admin', 'verifier') NOT NULL DEFAULT 'student',
    common_name VARCHAR(255),
    organization VARCHAR(255),
    organizational_unit VARCHAR(255),
    country VARCHAR(255),
    state VARCHAR(255),
    locality VARCHAR(255),
    certificate TEXT,  -- Chứng chỉ số Hyperledger Fabric
    public_key BLOB, 
    private_key BLOB, 
    enrollment_secret VARCHAR(255),
    pin_code CHAR(6) DEFAULT NULL CHECK (pin_code REGEXP '^[0-9]{6}$' OR pin_code IS NULL), 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE universities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    country VARCHAR(100),
    state VARCHAR(100),
    locality VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE majors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE degree_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,  -- Loại bằng cấp (Cử nhân, Thạc sĩ, Tiến sĩ...)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE degrees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,  -- Người nhận bằng cấp
    university_id INT NOT NULL,  -- Trường cấp bằng
    major_id INT NOT NULL,  -- Ngành học
    degree_type_id INT NOT NULL,  -- Loại bằng cấp (liên kết đến bảng degree_types)
    degree_name VARCHAR(255) NOT NULL,  -- Tên bằng cấp cụ thể (Kỹ sư CNTT, Thạc sĩ Kinh tế…)
    graduation_year YEAR NOT NULL,  -- Năm tốt nghiệp
    gpa DECIMAL(3,2),  -- Điểm trung bình
    degree_image LONGBLOB,  -- Ảnh scan bằng cấp (Lưu trực tiếp trong DB)
    blockchain_hash BINARY(32) UNIQUE,  -- Hash của bằng cấp trên Blockchain (SHA-256)
    verification_code VARCHAR(20) UNIQUE,  -- Mã xác thực duy nhất
    qr_code TEXT,  -- QR Code chứa verification_code
    status ENUM('valid', 'revoked', 'pending') NOT NULL DEFAULT 'pending',  -- Trạng thái bằng cấp
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Thời gian cấp bằng

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE CASCADE,
    FOREIGN KEY (major_id) REFERENCES majors(id) ON DELETE CASCADE,
    FOREIGN KEY (degree_type_id) REFERENCES degree_types(id) ON DELETE CASCADE
);


CREATE TABLE verifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    degree_id INT NOT NULL,  -- Bằng cấp được xác thực
    verified_by INT,  -- Người xác thực (admin, tổ chức…)
    verification_method ENUM('code', 'qrcode', 'image') NOT NULL DEFAULT 'image',  -- Phương thức xác thực
    verification_status ENUM('success', 'failed') NOT NULL,  -- Kết quả xác thực
    verification_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (degree_id) REFERENCES degrees(id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,  -- Người gửi yêu cầu
    degree_id INT NOT NULL,  -- Bằng cấp cần xác thực
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',  -- Trạng thái xử lý
    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    response_date TIMESTAMP NULL,
    response_by INT NULL,  -- Người xử lý (admin, trường đại học)
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (degree_id) REFERENCES degrees(id) ON DELETE CASCADE,
    FOREIGN KEY (response_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE revocations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    degree_id INT NOT NULL UNIQUE,  -- Bằng cấp bị thu hồi
    revoked_by INT NOT NULL,  -- Người thực hiện thu hồi
    reason TEXT NOT NULL,  -- Lý do thu hồi
    revoked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (degree_id) REFERENCES degrees(id) ON DELETE CASCADE,
    FOREIGN KEY (revoked_by) REFERENCES users(id) ON DELETE CASCADE
);
