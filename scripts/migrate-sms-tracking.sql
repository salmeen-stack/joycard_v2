-- Add SMS delivery tracking columns to invitations table
ALTER TABLE invitations 
ADD COLUMN IF NOT EXISTS sms_delivery_status TEXT CHECK (sms_delivery_status IN ('pending','delivered','failed'));

ALTER TABLE invitations 
ADD COLUMN IF NOT EXISTS sms_delivery_message TEXT;

ALTER TABLE invitations 
ADD COLUMN IF NOT EXISTS sms_sent_at TIMESTAMPTZ;

ALTER TABLE invitations 
ADD COLUMN IF NOT EXISTS sms_delivered_at TIMESTAMPTZ;
