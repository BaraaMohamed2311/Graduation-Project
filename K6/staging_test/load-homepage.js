import http from 'k6/http';
import { sleep, check } from 'k6';

// ----- Test configuration -----
export let options = {
    stages: [
        { duration: '30s', target: 500 },   // ramp up to 50 virtual users
        { duration: '1m', target: 100 },    // stay at 50 users
        { duration: '30s', target: 500 },    // ramp down to 0
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'], // 95% of requests should be < 500ms
        http_req_failed: ['rate<0.01'],   // <1% failed requests
    },
};

// ----- Main load function -----
export default function () {
    const ems_res = http.get('http://84.8.107.143:3150');
    const hospital_res = http.get('http://84.8.107.143:3151');

    check(ems_res, {
        'status is 200': (r) => r.status === 200,
        'body is not empty': (r) => r.body.length > 0,
    });

    check(hospital_res, {
        'status is 200': (r) => r.status === 200,
        'body is not empty': (r) => r.body.length > 0,
    });

    sleep(1); // wait 1 second between iterations
}
