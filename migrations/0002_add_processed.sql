-- «Обработано» pressed in Telegram (worker/index.ts → handleTelegram): when and by whom; empty = not yet
ALTER TABLE submissions ADD COLUMN processed_at TEXT NOT NULL DEFAULT '';
ALTER TABLE submissions ADD COLUMN processed_by TEXT NOT NULL DEFAULT '';
