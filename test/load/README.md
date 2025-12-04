# Load Testing with k6

This directory contains load testing scripts for the PDF Merger Server.

## Prerequisites

Install k6:
- **Windows**: `choco install k6` or download from [k6.io](https://k6.io/docs/getting-started/installation/)
- **macOS**: `brew install k6`
- **Linux**: `sudo apt-get install k6`

## Running the Tests

### Basic Test
```bash
k6 run test/load/k6-script.js
```

### With Custom Base URL
```bash
k6 run --env BASE_URL=https://your-server.com test/load/k6-script.js
```

### With Custom VUs (Virtual Users)
```bash
k6 run --vus 100 --duration 5m test/load/k6-script.js
```

## Test Scenarios

The k6 script simulates a complete user flow:
1. **Get presigned upload URL** - `POST /api/v1/uploads/presign`
2. **Upload PDF file** - `PUT` to S3 presigned URL
3. **Create merge job** - `POST /api/v1/merge`
4. **Poll job status** - `GET /api/v1/merge/jobs/:id`
5. **Get download URL** - `GET /api/v1/merge/jobs/:id/download`

## Load Profile

Default stages:
- **30s**: Ramp up to 10 users
- **1m**: Ramp up to 50 users
- **2m**: Sustain 50 users
- **30s**: Ramp down to 0 users

## Success Criteria

- **Response Time**: 95% of requests < 2 seconds
- **Error Rate**: < 10%

## Interpreting Results

After the test completes, k6 will display:
- **http_req_duration**: Request duration metrics (avg, min, max, p95, p99)
- **http_reqs**: Total number of requests
- **errors**: Custom error rate metric
- **vus**: Number of virtual users

## Example Output

```
     ✓ presign status is 201
     ✓ upload status is 200
     ✓ merge status is 201
     ✓ status check is 200
     ✓ job completed successfully
     ✓ download URL status is 200

     checks.........................: 100.00% ✓ 1500      ✗ 0
     data_received..................: 2.1 MB  5.8 kB/s
     data_sent......................: 1.5 MB  4.2 kB/s
     errors.........................: 0.00%   ✓ 0         ✗ 0
     http_req_duration..............: avg=1.2s    min=100ms max=3s p(95)=1.8s
     http_reqs......................: 1500    4.16/s
     vus............................: 50      min=0       max=50
```

## Troubleshooting

1. **Connection refused**: Ensure the server is running
2. **High error rate**: Check server logs and resource usage
3. **Timeout errors**: Increase `maxAttempts` in the script or check worker performance
