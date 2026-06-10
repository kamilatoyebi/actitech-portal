# Notification System Setup

## Database Tables

Run these SQL commands in Supabase SQL Editor to set up the notification system.

### 1. Requests Table
```sql
CREATE TABLE IF NOT EXISTS requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  -- draft, submitted, hod_review, management_review, approved, fulfilled, rejected
  hod_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  management_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  priority TEXT DEFAULT 'medium',
  -- low, medium, high, urgent
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  hod_approved_at TIMESTAMP WITH TIME ZONE,
  management_approved_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for better query performance
CREATE INDEX requests_requester_id_idx ON requests(requester_id);
CREATE INDEX requests_hod_id_idx ON requests(hod_id);
CREATE INDEX requests_management_id_idx ON requests(management_id);
CREATE INDEX requests_status_idx ON requests(status);
```

### 2. Notifications Table
```sql
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  -- new_request, hod_approved, management_approved, request_rejected, request_fulfilled
  title TEXT NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  -- e.g., "/requests/[id]" or "/my_requests"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX notifications_user_id_idx ON notifications(user_id);
CREATE INDEX notifications_request_id_idx ON notifications(request_id);
CREATE INDEX notifications_read_idx ON notifications(read);
CREATE INDEX notifications_created_at_idx ON notifications(created_at DESC);
```

### 3. Enable Row Level Security (RLS)

```sql
-- Enable RLS on both tables
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Requests RLS policies
CREATE POLICY requests_requester_read ON requests
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = hod_id OR auth.uid() = management_id);

CREATE POLICY requests_anyone_read ON requests
  FOR SELECT USING (true);

CREATE POLICY requests_requester_insert ON requests
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY requests_requester_update ON requests
  FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = hod_id OR auth.uid() = management_id);

-- Notifications RLS policies
CREATE POLICY notifications_user_read ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY notifications_insert ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY notifications_user_update ON notifications
  FOR UPDATE USING (auth.uid() = user_id);
```

### 4. Setup Triggers for Automatic Timestamps
```sql
CREATE OR REPLACE FUNCTION update_requests_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_requests_timestamp_trigger
BEFORE UPDATE ON requests
FOR EACH ROW
EXECUTE FUNCTION update_requests_timestamp();
```

## Setup Steps

1. **Copy the SQL above**
2. **Go to Supabase Dashboard** → Your Project
3. **SQL Editor** → Click "New Query"
4. **Paste all the SQL** above
5. **Click "Run"** to execute
6. **Verify** tables appear in the Tables section on the left sidebar

## What's Created

- **requests** table: Tracks all employee requests through the workflow
- **notifications** table: In-app notifications for all users
- **RLS Policies**: Security policies ensuring users see only their relevant notifications
- **Indexes**: Performance optimization for common queries
- **Triggers**: Automatic timestamp updates when records change
