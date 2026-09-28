-- The contact popup (worker/index.ts → handleForm): the chosen subjects as comma-separated slugs (SUBJECTS in
-- worker/validate.ts) and the message with its line breaks; empty = not given. `phone` stays for the older rows ('' in new ones)
ALTER TABLE submissions ADD COLUMN subjects TEXT NOT NULL DEFAULT '';
ALTER TABLE submissions ADD COLUMN message TEXT NOT NULL DEFAULT '';
