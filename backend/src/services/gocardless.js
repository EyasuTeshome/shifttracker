const axios = require('axios');
const db = require('../db/index');

const BASE = 'https://bankaccountdata.gocardless.com/api/v2';

async function getAccessToken() {
  const row = db.prepare('SELECT * FROM gocardless_tokens WHERE id=1').get();
  if (row && row.access_token && new Date(row.access_exp) > new Date()) {
    return row.access_token;
  }
  if (row && row.refresh_token && new Date(row.refresh_exp) > new Date()) {
    return await refreshToken(row.refresh_token);
  }
  return await fetchNewToken();
}

async function fetchNewToken() {
  const { data } = await axios.post(`${BASE}/token/new/`, {
    secret_id: process.env.GOCARDLESS_SECRET_ID,
    secret_key: process.env.GOCARDLESS_SECRET_KEY,
  });
  saveTokens(data);
  return data.access;
}

async function refreshToken(refresh) {
  const { data } = await axios.post(`${BASE}/token/refresh/`, { refresh });
  const row = db.prepare('SELECT * FROM gocardless_tokens WHERE id=1').get();
  const exp = new Date(Date.now() + data.access_expires * 1000).toISOString();
  db.prepare(`
    UPDATE gocardless_tokens SET access_token=?, access_exp=? WHERE id=1
  `).run(data.access, exp);
  return data.access;
}

function saveTokens(data) {
  const accessExp  = new Date(Date.now() + data.access_expires  * 1000).toISOString();
  const refreshExp = new Date(Date.now() + data.refresh_expires * 1000).toISOString();
  db.prepare(`
    INSERT INTO gocardless_tokens (id, access_token, refresh_token, access_exp, refresh_exp)
    VALUES (1, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      access_token=excluded.access_token,
      refresh_token=excluded.refresh_token,
      access_exp=excluded.access_exp,
      refresh_exp=excluded.refresh_exp
  `).run(data.access, data.refresh, accessExp, refreshExp);
}

async function authHeader() {
  const token = await getAccessToken();
  return { Authorization: `Bearer ${token}` };
}

async function createRequisition() {
  const headers = await authHeader();
  const { data } = await axios.post(`${BASE}/requisitions/`, {
    redirect: process.env.GOCARDLESS_REDIRECT_URL,
    institution_id: process.env.GOCARDLESS_INSTITUTION_ID,
    reference: `finance-${Date.now()}`,
    user_language: 'EN',
  }, { headers });
  return data;
}

async function getRequisition(id) {
  const headers = await authHeader();
  const { data } = await axios.get(`${BASE}/requisitions/${id}/`, { headers });
  return data;
}

async function getAccountDetails(accountId) {
  const headers = await authHeader();
  const [details, balances] = await Promise.all([
    axios.get(`${BASE}/accounts/${accountId}/details/`,  { headers }),
    axios.get(`${BASE}/accounts/${accountId}/balances/`, { headers }),
  ]);
  return { details: details.data, balances: balances.data };
}

async function getTransactions(accountId, dateFrom) {
  const headers = await authHeader();
  const params = dateFrom ? { date_from: dateFrom } : {};
  const { data } = await axios.get(
    `${BASE}/accounts/${accountId}/transactions/`,
    { headers, params }
  );
  return data.transactions || { booked: [], pending: [] };
}

module.exports = { createRequisition, getRequisition, getAccountDetails, getTransactions };
