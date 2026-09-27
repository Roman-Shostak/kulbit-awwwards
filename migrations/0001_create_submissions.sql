-- Form submissions (worker/index.ts). Only what the visitor typed plus where and when: no IP, no user agent.
-- `notified` lists the channels that received the notification ("telegram,email"); empty = every channel failed,
-- the submission is still here.
CREATE TABLE submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  form TEXT NOT NULL,
  page TEXT NOT NULL,
  locale TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  consent_at TEXT NOT NULL,
  notified TEXT NOT NULL DEFAULT ''
);
CREATE INDEX submissions_created_at ON submissions (created_at);
