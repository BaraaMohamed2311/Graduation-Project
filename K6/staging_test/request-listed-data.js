import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
};

const BASE_URLS = [

 'http://84.8.107.143:3151',
];



const USERS = [
  { email: 'super1@test.com', password: '123456' },
  { email: 'super2@test.com', password: '123456' },
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

export default function (TOKENS) {
  BASE_URLS.forEach((baseUrl) => {
    USERS.forEach((user) => {
      const token = TOKENS[baseUrl][user.email].token;
        console.log(`Using token for ${user.email} at ${baseUrl}: ${token}`);
      for (let page = 1; page <= 3; page++) {
        if(!token) {
          console.error(`No token for ${user.email} at ${baseUrl}, skipping request.`);
          continue; // skip this iteration if token is missing
        }
        const size = 10;
        const url = `${baseUrl}/api/list/employees?pagination=${page}&size=${size}&user_id=${TOKENS[baseUrl][user.email].user_id}`;

        const res = http.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        check(res, {
          'employees fetched': (r) => r.status === 200,
          'response not empty': (r) => r.json('body').length > 0,
        });
      }

      sleep(1);
    });
  });
}