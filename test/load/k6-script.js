import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
    stages: [
        { duration: '30s', target: 10 },  // Ramp up to 10 users
        { duration: '1m', target: 50 },   // Ramp up to 50 users
        { duration: '2m', target: 50 },   // Stay at 50 users
        { duration: '30s', target: 0 },   // Ramp down to 0 users
    ],
    thresholds: {
        http_req_duration: ['p(95)<2000'], // 95% of requests should be below 2s
        errors: ['rate<0.1'],              // Error rate should be below 10%
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
    // 1. Get presigned upload URL
    const presignRes = http.post(`${BASE_URL}/api/v1/uploads/presign`, JSON.stringify({
        filename: 'test.pdf',
        contentType: 'application/pdf',
    }), {
        headers: { 'Content-Type': 'application/json' },
    });

    check(presignRes, {
        'presign status is 201': (r) => r.status === 201,
    }) || errorRate.add(1);

    if (presignRes.status !== 201) {
        return;
    }

    const { url, key } = presignRes.json();

    // 2. Upload PDF (simulated with small payload)
    const pdfContent = '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n';
    const uploadRes = http.put(url, pdfContent, {
        headers: { 'Content-Type': 'application/pdf' },
    });

    check(uploadRes, {
        'upload status is 200': (r) => r.status === 200,
    }) || errorRate.add(1);

    // 3. Create merge job
    const mergeRes = http.post(`${BASE_URL}/api/v1/merge`, JSON.stringify({
        files: [
            { fileKey: key, order: 1 },
            { fileKey: key, order: 2 }, // Reuse same file for simplicity
        ],
        options: {
            outputFilename: 'merged-test.pdf',
        },
    }), {
        headers: { 'Content-Type': 'application/json' },
    });

    check(mergeRes, {
        'merge status is 201': (r) => r.status === 201,
    }) || errorRate.add(1);

    if (mergeRes.status !== 201) {
        return;
    }

    const { id: jobId } = mergeRes.json();

    // 4. Poll job status
    let jobStatus = 'PENDING';
    let attempts = 0;
    const maxAttempts = 30;

    while (jobStatus !== 'COMPLETED' && jobStatus !== 'FAILED' && attempts < maxAttempts) {
        sleep(2);
        const statusRes = http.get(`${BASE_URL}/api/v1/merge/jobs/${jobId}`);

        check(statusRes, {
            'status check is 200': (r) => r.status === 200,
        }) || errorRate.add(1);

        if (statusRes.status === 200) {
            jobStatus = statusRes.json('status');
        }
        attempts++;
    }

    check(jobStatus, {
        'job completed successfully': (status) => status === 'COMPLETED',
    }) || errorRate.add(1);

    // 5. Get download URL
    if (jobStatus === 'COMPLETED') {
        const downloadRes = http.get(`${BASE_URL}/api/v1/merge/jobs/${jobId}/download`);

        check(downloadRes, {
            'download URL status is 200': (r) => r.status === 200,
        }) || errorRate.add(1);
    }

    sleep(1);
}
