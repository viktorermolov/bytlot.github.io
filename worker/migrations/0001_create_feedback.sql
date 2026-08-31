CREATE TABLE feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL
    DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  feedback_type TEXT NOT NULL
    CHECK (feedback_type IN ('suggestion', 'bug', 'confusing', 'other')),
  message TEXT NOT NULL
    CHECK (length(message) BETWEEN 10 AND 2000),
  product TEXT NOT NULL
    CHECK (product = 'driver-profit'),
  page_path TEXT NOT NULL
    CHECK (page_path = '/'),
  calculator_mode TEXT NOT NULL
    CHECK (calculator_mode IN ('shift', 'offer')),
  app_version TEXT
    CHECK (
      app_version IS NULL OR
      length(app_version) BETWEEN 1 AND 64
    ),
  viewport_category TEXT NOT NULL
    CHECK (viewport_category IN ('mobile', 'tablet', 'desktop')),
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'reviewed', 'planned', 'resolved', 'dismissed'))
);
