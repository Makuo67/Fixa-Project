import axios from 'axios';

var token = null;

if (process.browser) {
  token = localStorage.getItem('token');
}

const http = axios.create({
  baseURL: 'api.fixarwanda.com',
  headers: {
    Authorization: token || null,
    'Content-type': 'application/json',
  },
});

export default http;
