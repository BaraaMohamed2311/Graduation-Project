import http from 'k6/http';
import { check, sleep } from 'k6';
// numof iterations = vus * duration (in seconds) / sleep time (in seconds) = 10 * 30 / 1 = 300 iteration 
// each user will make 3 requests (for 3 pages) per iteration, so total requests = 300 * 3 = 900 requests per user to one url

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.05'], // <5% failures → ≥95% success
  },
};

const BASE_URLS = [
  'http://84.8.107.143:3150',
 'http://84.8.107.143:3151',
];


const i = 10; // number of users to simulate

const superUsers = Array.from({ length: i }, (_, n) => ({
  email: `super_${n + 1}@test.com`,
  password: '123456'
}));

const adminUsers = Array.from({ length: i }, (_, n) => ({
  email: `admin_${n + 1}@test.com`,
  password: '123456'
}))


const USERS = [...superUsers, ...adminUsers];

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


export default function (TOKENS) {
  BASE_URLS.forEach((baseUrl) => {
    USERS.forEach((user) => {
      const userTokenObj = TOKENS[baseUrl]?.[user.email];
      if (!userTokenObj || !userTokenObj.token) {
        console.error(`No token for ${user.email} , ${userTokenObj?.user_id} at ${baseUrl}, skipping request.`);
        return; // skip this user if no token
      }

      const { token, user_id } = userTokenObj;
      console.log(`Using token for ${user.email} at ${baseUrl}: ${token}`);

      for (let page = 1; page <= 3; page++) {
        const url = `${baseUrl}/api/list/employees?pagination=${page}&size=10&user_id=${user_id}`;
        let res;
        try {
          res = http.get(url, { headers: { Authorization: `Bearer ${token}` } });
        } catch (err) {
          console.error(`Request failed for ${user.email}, page ${page}:`, err);
          continue;
        }

        let data;
        try {
          data = res.json();
        } catch (err) {
          console.error(`Failed to parse JSON for ${user.email}, page ${page}. Raw:`, res.body);
          continue;
        }

        if (!data?.body) console.error(`BAD RESPONSE for ${user.email}, page ${page}:`, res.body);

        check(res, {
          'employees fetched': (r) => r.status === 200,
          'response not empty': () => data.success === true && Array.isArray(data.body) && data.body.length > 0,
        });
      }

      sleep(1);
    });
  });
}