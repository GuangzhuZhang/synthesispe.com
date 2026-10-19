CREATE TABLE comments (id TEXT PRIMARY KEY, page TEXT NOT NULL, nickname TEXT, email_ciphertext TEXT, body TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', risk_score INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, ip_hash TEXT NOT NULL);
CREATE INDEX comments_page_status ON comments(page,status,created_at);
CREATE TABLE reports (id TEXT PRIMARY KEY, comment_id TEXT NOT NULL, page TEXT NOT NULL, created_at TEXT NOT NULL, ip_hash TEXT NOT NULL);
CREATE TABLE moderation_log (id TEXT PRIMARY KEY, comment_id TEXT, action TEXT NOT NULL, reason TEXT, actor TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE rate_limits (bucket TEXT PRIMARY KEY, count INTEGER NOT NULL, expires_at INTEGER NOT NULL);
