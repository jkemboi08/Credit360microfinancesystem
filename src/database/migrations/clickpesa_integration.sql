-- ClickPesa Integration Database Schema
-- This file contains the database schema for ClickPesa integration

-- ClickPesa transactions table
CREATE TABLE IF NOT EXISTS clickpesa_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_id VARCHAR(255) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('payout', 'payment')),
    reference VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'TZS',
    recipient_phone VARCHAR(20),
    customer_phone VARCHAR(20),
    recipient_name VARCHAR(255),
    customer_name VARCHAR(255),
    description TEXT,
    payment_url TEXT,
    webhook_data JSONB,
    response_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    loan_id UUID REFERENCES loans(id),
    client_id UUID REFERENCES clients(id)
);

-- ClickPesa webhook events table
CREATE TABLE IF NOT EXISTS clickpesa_webhook_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    transaction_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    reference VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    event_data JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ClickPesa integration configuration table
CREATE TABLE IF NOT EXISTS clickpesa_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id VARCHAR(255) NOT NULL,
    api_key VARCHAR(500) NOT NULL,
    base_url VARCHAR(255) NOT NULL DEFAULT 'https://api.clickpesa.com',
    webhook_url VARCHAR(255),
    environment VARCHAR(20) NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'production')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Integration logs table (extends existing integration_logs)
CREATE TABLE IF NOT EXISTS integration_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    integration_name VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    request_data JSONB,
    response_data JSONB,
    error_message TEXT,
    duration_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment methods table (extends existing payment_methods)
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    provider VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    config JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert ClickPesa as a payment method
INSERT INTO payment_methods (name, type, provider, is_active, config) VALUES
('ClickPesa Payout', 'disbursement', 'clickpesa', true, '{"supports_bulk": true, "supports_single": true}'),
('ClickPesa Payment', 'collection', 'clickpesa', true, '{"supports_web": true, "supports_mobile": true}');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clickpesa_transactions_transaction_id ON clickpesa_transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_clickpesa_transactions_reference ON clickpesa_transactions(reference);
CREATE INDEX IF NOT EXISTS idx_clickpesa_transactions_status ON clickpesa_transactions(status);
CREATE INDEX IF NOT EXISTS idx_clickpesa_transactions_type ON clickpesa_transactions(type);
CREATE INDEX IF NOT EXISTS idx_clickpesa_transactions_created_at ON clickpesa_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_clickpesa_webhook_events_transaction_id ON clickpesa_webhook_events(transaction_id);
CREATE INDEX IF NOT EXISTS idx_clickpesa_webhook_events_event_type ON clickpesa_webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_clickpesa_webhook_events_processed ON clickpesa_webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_clickpesa_webhook_events_created_at ON clickpesa_webhook_events(created_at);

CREATE INDEX IF NOT EXISTS idx_integration_logs_integration_name ON integration_logs(integration_name);
CREATE INDEX IF NOT EXISTS idx_integration_logs_created_at ON integration_logs(created_at);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clickpesa_transactions_updated_at 
    BEFORE UPDATE ON clickpesa_transactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clickpesa_configs_updated_at 
    BEFORE UPDATE ON clickpesa_configs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at 
    BEFORE UPDATE ON payment_methods 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views for reporting
CREATE OR REPLACE VIEW clickpesa_transaction_summary AS
SELECT 
    DATE(created_at) as transaction_date,
    type,
    status,
    COUNT(*) as transaction_count,
    SUM(amount) as total_amount,
    AVG(amount) as average_amount
FROM clickpesa_transactions
GROUP BY DATE(created_at), type, status
ORDER BY transaction_date DESC;

CREATE OR REPLACE VIEW clickpesa_daily_stats AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_transactions,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful_transactions,
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_transactions,
    SUM(CASE WHEN type = 'payout' THEN amount ELSE 0 END) as total_payouts,
    SUM(CASE WHEN type = 'payment' THEN amount ELSE 0 END) as total_payments
FROM clickpesa_transactions
GROUP BY DATE(created_at)
ORDER BY date DESC;
