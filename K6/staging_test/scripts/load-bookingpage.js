import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'], // <1% failures → ≥99% success
  },
};

const BASE_URLS = [

  'http://84.8.107.143:3151',
];



const USERS = [
  { email: 'patient@test.com', password: '123456' },

];

// setup function returns tokens for all users per base URL
export function setup() {
  const TOKENS = {};

  BASE_URLS.forEach((baseUrl) => {
    USERS.forEach((user) => {
      const res = http.post(`${baseUrl}/api/user/login`, JSON.stringify({
        user_email: user.email,
        password: user.password,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });

      check(res, {
        'login success': (r) => r.status === 200,
        'token received': (r) => r.json('body')?.token !== undefined,
      });

        const responseBody = res.json();
        const { token, user_id } = responseBody?.body ?? {};
        console.log("RAW:", res.body); // always log the raw string first

      if (!TOKENS[baseUrl]) TOKENS[baseUrl] = {};
      TOKENS[baseUrl][user.email] = { token, user_email: user.email, user_id };

      console.log(`Logged in ${user.email} to ${baseUrl}, token: ${token}, user_id: ${user_id}`);
      console.log("ASSIGNED TOKENS:", JSON.stringify(TOKENS));
    });
  });

  return TOKENS;
}

function fetchList(TOKENS, endpoint, label) {
  BASE_URLS.forEach((baseUrl) => {
    USERS.forEach((user) => {
      const token = TOKENS[baseUrl][user.email]?.token;
      const user_id = TOKENS[baseUrl][user.email]?.user_id;

      if (!token) {
        console.error(`No token for ${user.email} at ${baseUrl}, skipping ${label}.`);
        return;
      }

      console.log(`Using token for ${user.email} at ${baseUrl}: ${token}`);

      for (let page = 1; page <= 2; page++) {
        const url = `${baseUrl}/api/list/${endpoint}?pagination=${page}&size=10&user_id=${user_id}`;
        const res = http.get(url, { headers: { Authorization: `Bearer ${token}` } });

        let data;
        try {
          data = res.json();
        } catch (e) {
          console.error(`Failed to parse JSON for ${label} page ${page}:`, res.body);
          continue;
        }

        if (!data?.body) {
          console.error(`BAD RESPONSE for ${label} page ${page}:`, res.body);
        }

        check(res, {
          [`${label} fetched`]: (r) => r.status === 200,
          [`${label} not empty`]: (r) => Array.isArray(data.body) && data.body.length > 0,
        });
      }

      sleep(1);
    });
  });
}

export function getDoctors(TOKENS) {
  fetchList(TOKENS, 'doctors', 'Doctors');
}

export function getSurgeons(TOKENS) {
  fetchList(TOKENS, 'surgeons', 'Surgeons');
}



export default function (TOKENS) {
  getDoctors(TOKENS);
  getSurgeons(TOKENS);
}