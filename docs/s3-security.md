# S3 Security Configuration

## Bucket Policy

Ensure your S3 bucket has the following security settings:

### 1. Block Public Access
All public access should be blocked:
- ✅ Block all public access
- ✅ Block public access to buckets and objects granted through new access control lists (ACLs)
- ✅ Block public access to buckets and objects granted through any access control lists (ACLs)
- ✅ Block public access to buckets and objects granted through new public bucket or access point policies
- ✅ Block public and cross-account access to buckets and objects through any public bucket or access point policies

### 2. Bucket Policy (Least Privilege)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowBackendAccess",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::ACCOUNT_ID:user/pdf-merger-backend"
      },
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::pdf-merger-bucket/*"
    }
  ]
}
```

### 3. IAM User Policy (Backend Service)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::pdf-merger-bucket",
        "arn:aws:s3:::pdf-merger-bucket/*"
      ]
    }
  ]
}
```

### 4. Presigned URL Configuration

Current settings in `S3Service`:
- **Upload URL Expiration**: 1 hour (3600 seconds)
- **Download URL Expiration**: 1 hour (3600 seconds)

**Recommendation**: Reduce to 15 minutes (900 seconds) for production.

Update in `src/s3/s3.service.ts`:
```typescript
async getSignedUploadUrl(key: string, contentType: string, expiresIn = 900)
async getSignedDownloadUrl(key: string, expiresIn = 900)
```

### 5. CORS Configuration

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "GET"],
    "AllowedOrigins": ["https://your-frontend-domain.com"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

### 6. Encryption

Enable server-side encryption:
- **SSE-S3**: Automatic encryption with S3-managed keys
- **SSE-KMS**: Encryption with AWS KMS keys (recommended for compliance)

### 7. Versioning

Enable versioning for accidental deletion protection:
```bash
aws s3api put-bucket-versioning \
  --bucket pdf-merger-bucket \
  --versioning-configuration Status=Enabled
```

### 8. Lifecycle Policy

Automatically delete old files:
```json
{
  "Rules": [
    {
      "Id": "DeleteOldMergedFiles",
      "Status": "Enabled",
      "Prefix": "merged/",
      "Expiration": {
        "Days": 7
      }
    },
    {
      "Id": "DeleteOldUploads",
      "Status": "Enabled",
      "Prefix": "uploads/",
      "Expiration": {
        "Days": 1
      }
    }
  ]
}
```

## Supabase Storage Configuration

If using Supabase Storage (S3-compatible):

### 1. Bucket Settings
```sql
-- Create bucket with private access
INSERT INTO storage.buckets (id, name, public)
VALUES ('pdf-merger-bucket', 'pdf-merger-bucket', false);
```

### 2. Storage Policies
```sql
-- Allow authenticated service role to upload
CREATE POLICY "Service can upload files"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'pdf-merger-bucket');

-- Allow authenticated service role to read
CREATE POLICY "Service can read files"
ON storage.objects FOR SELECT
TO service_role
USING (bucket_id = 'pdf-merger-bucket');

-- Allow authenticated service role to delete
CREATE POLICY "Service can delete files"
ON storage.objects FOR DELETE
TO service_role
USING (bucket_id = 'pdf-merger-bucket');
```

## Security Checklist

- [ ] Bucket is not publicly accessible
- [ ] IAM user has least-privilege permissions
- [ ] Presigned URLs expire within 15 minutes
- [ ] CORS is configured with specific origins
- [ ] Server-side encryption is enabled
- [ ] Lifecycle policies are configured
- [ ] Access logging is enabled
- [ ] Versioning is enabled (optional)
- [ ] MFA Delete is enabled (optional, for critical data)

## Monitoring

Set up CloudWatch alarms for:
- Unauthorized access attempts
- Unusual download patterns
- Storage quota exceeded
