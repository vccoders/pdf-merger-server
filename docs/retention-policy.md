# Data Retention Policy

## Overview
This document outlines the data retention and deletion policies for the PDF Merger Server.

## File Storage Retention

### Uploaded Files
- **Location**: `uploads/` prefix in S3 bucket
- **Retention Period**: 24 hours
- **Deletion Method**: Automatic via S3 Lifecycle Policy
- **Reason**: Temporary storage for merge processing

### Merged Files
- **Location**: `merged/` prefix in S3 bucket
- **Retention Period**: 7 days
- **Deletion Method**: Automatic via S3 Lifecycle Policy
- **Reason**: Allow users time to download results

### Temporary Files
- **Location**: Server filesystem (`/app/tmp`)
- **Retention Period**: Immediate deletion after job completion
- **Deletion Method**: Programmatic cleanup in worker
- **Reason**: Minimize disk usage

## Database Retention

### Job Records
- **Table**: `merge_jobs`
- **Retention Period**: 30 days
- **Deletion Method**: Manual cleanup script or scheduled job
- **Fields Retained**:
  - Job ID
  - Status
  - Created/Updated timestamps
  - Error messages (if failed)

### Cleanup Script
```sql
-- Delete completed jobs older than 30 days
DELETE FROM merge_jobs
WHERE status = 'COMPLETED'
  AND "updatedAt" < NOW() - INTERVAL '30 days';

-- Delete failed jobs older than 7 days
DELETE FROM merge_jobs
WHERE status = 'FAILED'
  AND "updatedAt" < NOW() - INTERVAL '7 days';
```

## S3 Lifecycle Configuration

### Apply via AWS CLI
```bash
aws s3api put-bucket-lifecycle-configuration \
  --bucket pdf-merger-bucket \
  --lifecycle-configuration file://lifecycle-policy.json
```

### lifecycle-policy.json
```json
{
  "Rules": [
    {
      "Id": "DeleteOldUploads",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "uploads/"
      },
      "Expiration": {
        "Days": 1
      }
    },
    {
      "Id": "DeleteOldMergedFiles",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "merged/"
      },
      "Expiration": {
        "Days": 7
      }
    },
    {
      "Id": "CleanupIncompleteUploads",
      "Status": "Enabled",
      "AbortIncompleteMultipartUpload": {
        "DaysAfterInitiation": 1
      }
    }
  ]
}
```

## Supabase Storage Lifecycle

For Supabase Storage, use a scheduled Edge Function:

```typescript
// supabase/functions/cleanup-old-files/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Delete old merged files
  const { data: oldFiles } = await supabase.storage
    .from('pdf-merger-bucket')
    .list('merged', {
      sortBy: { column: 'created_at', order: 'asc' },
    });

  const filesToDelete = oldFiles
    ?.filter((file) => new Date(file.created_at) < sevenDaysAgo)
    .map((file) => `merged/${file.name}`);

  if (filesToDelete && filesToDelete.length > 0) {
    await supabase.storage
      .from('pdf-merger-bucket')
      .remove(filesToDelete);
  }

  return new Response(
    JSON.stringify({ deleted: filesToDelete?.length || 0 }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
```

Schedule via Supabase Dashboard: `0 2 * * *` (daily at 2 AM)

## Compliance Considerations

### GDPR
- Users can request deletion of their data
- Implement a "right to be forgotten" endpoint
- Log all data access and deletion

### Data Minimization
- Only store necessary metadata
- Don't log file contents
- Redact sensitive information from logs

## Monitoring

Set up alerts for:
- Storage quota approaching limit
- Failed cleanup jobs
- Unusual retention patterns

## Backup Policy

### Database Backups
- **Frequency**: Daily
- **Retention**: 30 days
- **Method**: Automated database snapshots

### Critical Data
- Job metadata is backed up
- File contents are not backed up (temporary by design)

## Review Schedule

This policy should be reviewed:
- Quarterly
- After any compliance audit
- When retention requirements change
