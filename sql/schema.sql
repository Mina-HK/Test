CREATE DATABASE IF NOT EXISTS voucher_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE voucher_system;

CREATE TABLE IF NOT EXISTS cards (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code_hash CHAR(64) NOT NULL UNIQUE COMMENT 'HMAC-SHA256 hash used for lookup without storing plaintext code',
  code_encrypted TEXT NOT NULL COMMENT 'AES-256-GCM encrypted card code for admin export only',
  status ENUM('unused', 'used', 'expired') NOT NULL DEFAULT 'unused',
  expires_at DATETIME NULL,
  used_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_cards_status (status),
  INDEX idx_cards_expires_at (expires_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  card_id BIGINT UNSIGNED NOT NULL,
  customer_ref_masked VARCHAR(32) NOT NULL COMMENT 'Only first 6 and last 4 chars are retained for non-sensitive customer reference values',
  recharge_status ENUM('created', 'manual_review', 'queued', 'processing', 'succeeded', 'failed') NOT NULL DEFAULT 'created',
  valid_until DATETIME NOT NULL,
  warranty_until DATETIME NOT NULL,
  request_ip VARBINARY(16) NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_card FOREIGN KEY (card_id) REFERENCES cards(id),
  INDEX idx_orders_status (recharge_status),
  INDEX idx_orders_created_at (created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS apple_accounts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  label VARCHAR(128) NOT NULL,
  region CHAR(2) NOT NULL DEFAULT 'TR',
  status ENUM('available', 'busy', 'disabled', 'needs_review') NOT NULL DEFAULT 'available',
  balance_cents INT NOT NULL DEFAULT 0,
  currency CHAR(3) NOT NULL DEFAULT 'TRY',
  last_checked_at DATETIME NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_apple_accounts_status (status)
) ENGINE=InnoDB;
