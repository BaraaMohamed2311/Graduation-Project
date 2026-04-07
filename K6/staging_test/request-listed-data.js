import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
};

const BASE_URLS = [
  'http://84.8.107.143:3150',
  'http://84.8.107.143:3151',
];

// SuperAdmins
const USERS = [
  {
    email: 'super1@test.com',
    password: '123456', // match your backend expectation
  },
  {
    email: 'super2@test.com',
    password: '123456',
  },
];

function login(baseUrl, user) {
  const res = http.post(`${baseUrl}/api/user/login`, JSON.stringify({
    user_email: user.email,
    password: user.password,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  console.log(`Login response from ${baseUrl} for ${user.email} | ${res.status}: ${res.body}`);
  check(res, {
    'login success': (r) => r.status === 200,
    'token received': (r) => r.json('token') !== undefined,
  });

  return res.json('token');
}


export default function () {
  BASE_URLS.forEach((baseUrl) => {
    USERS.forEach((user) => {
      const token = login(baseUrl, user);

      // Example pagination: page=1, size=10
      for (let page = 1; page <= 3; page++) {
        const size = 10; // adjust as needed
        const url = `${baseUrl}/api/list/employees?pagination=${page}&size=${size}`;

        const res = http.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log(`Employees list from ${baseUrl}, user ${user.email}, page ${page}: ${res.body}`);

        check(res, {
          'employees fetched': (r) => r.status === 200,
          'response not empty': (r) => r.json().length > 0,
        });
      }

      sleep(1);
    });
  });
}