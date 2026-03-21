-- Create email templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  organizer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_templates_organizer_id ON email_templates(organizer_id);

-- Insert default templates
INSERT INTO email_templates (name, subject, body, organizer_id) VALUES 
('Wedding Invitation', 'You are invited to our wedding!', 'Dear {{guest_name}},\n\nYou are cordially invited to celebrate our special day.\n\nEvent: {{event_title}}\nDate: {{event_date}}\nLocation: {{event_location}}\n\nWe look forward to seeing you there!\n\nBest regards,\n{{organizer_name}}', NULL),
('Corporate Event', 'Invitation to {{event_title}}', 'Hello {{guest_name}},\n\nYou are invited to attend {{event_title}}.\n\nDate: {{event_date}}\nVenue: {{event_location}}\nDress Code: {{dress_code}}\n\nPlease RSVP by {{rsvp_date}}.\n\nThank you,\n{{organizer_name}}', NULL),
('Birthday Party', 'Celebrate with us!', 'Hi {{guest_name}},\n\nCome celebrate my birthday!\n\nWhen: {{event_date}}\nWhere: {{event_location}}\n\nIt wouldn''t be the same without you!\n\nSee you there!\n{{organizer_name}}', NULL)
ON CONFLICT DO NOTHING;
