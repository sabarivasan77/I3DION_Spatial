import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const bucketName = process.env.SUPABASE_BUCKET || 'uploads';

async function createBucket() {
  console.log(`Checking if bucket '${bucketName}' exists...`);
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  
  if (listError) {
    console.error("Error listing buckets:", listError);
    process.exit(1);
  }

  const exists = buckets.some(b => b.name === bucketName);
  
  if (exists) {
    console.log(`Bucket '${bucketName}' already exists.`);
  } else {
    console.log(`Creating bucket '${bucketName}'...`);
    const { data, error } = await supabase.storage.createBucket(bucketName, {
      public: true,
      allowedMimeTypes: ['image/*', 'model/gltf-binary', 'model/vnd.usdz+zip', 'application/pdf'],
      fileSizeLimit: 52428800 // 50MB
    });
    
    if (error) {
      console.error("Error creating bucket:", error);
      process.exit(1);
    }
    
    console.log("Bucket created successfully:", data);
  }
}

createBucket();
