import http from 'k6/http';
import { sleep, check } from 'k6';

// ----- Test configuration -----
export let options = {
    vus: 100,
    duration: '30s',
    thresholds: {
        http_req_failed: ['rate<0.05'], // <5% failures → ≥95% success
    }
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
