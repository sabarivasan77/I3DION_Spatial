import dotenv from 'dotenv';
dotenv.config();
import { query } from './src/db/pool.js';

async function setupRls() {
  console.log('Setting up RLS policy for Supabase storage bucket "uploads"...');
  
  try {
    // 1. Give authenticated users permission to insert objects into the 'uploads' bucket
    await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies 
          WHERE tablename = 'objects' 
          AND schemaname = 'storage' 
          AND policyname = 'Allow authenticated users to insert files to uploads bucket'
        ) THEN
          CREATE POLICY "Allow authenticated users to insert files to uploads bucket"
          ON storage.objects FOR INSERT
          WITH CHECK (bucket_id = 'uploads' AND auth.role() = 'authenticated');
        END IF;
      END
      $$;
    `);

    // 2. Allow users to update their own objects if needed
    await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies 
          WHERE tablename = 'objects' 
          AND schemaname = 'storage' 
          AND policyname = 'Allow authenticated users to update their files'
        ) THEN
          CREATE POLICY "Allow authenticated users to update their files"
          ON storage.objects FOR UPDATE
          USING (bucket_id = 'uploads' AND auth.uid() = owner AND auth.role() = 'authenticated')
          WITH CHECK (bucket_id = 'uploads' AND auth.role() = 'authenticated');
        END IF;
      END
      $$;
    `);

    console.log('RLS policies setup successfully.');
  } catch (err) {
    console.error('Error setting up RLS:', err);
  } finally {
    process.exit(0);
  }
}

setupRls();
