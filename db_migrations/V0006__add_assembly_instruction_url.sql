-- Add assembly instruction URL column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS assembly_instruction_url TEXT;