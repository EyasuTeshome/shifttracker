const axios = require('axios');
const db = require('../db/index');

const BASE = 'https://bankaccountdata.gocardless.com/api/v2';

async function getAccessToken() {
  const row = await db.one('SELECT * FROM gocardless_tokens WHERE id=1');
  if (row?.access_token && new Date(row.access_exp) > new Date()) return row.access_token;
  if (row?.refresh_token && new Date(row.refresh_exp) > new Date()) return refreshToken(row.refresh_token);
  return fetchNewToken();
}

async function fetchNewToken() {
  const { data } = await axios.post(`${BASE}/token/new/`, {
    secret_id: process.env.GOCARDLESS_SECRET_ID,
    secret_key: process.env.GOCARDLESS_SECRET_KEY,
  });
  await saveTokens(data);
  return data.access;
}

async function refreshToken(refresh) {
  const { data } = await axios.post(`${BASE}/token/refresh/`, { refresh });
  const exp = new Date(Date.now() + data.access_expires * 1000);
  await db.query(
    'UPDATE gocardless_tokens SET access_token=$1, access_exp=$2 WHERE id=1',
    [data.access, exp]
  );
  return data.access;
}

async function saveTokens(data) {
  const accessExp  = new Date(Date.now() + data.access_expires  * 1000);
  const refreshExp = new Date(Date.now() + data.refresh_expires * 1000);
  await db.query(`
    INSERT INTO gocardless_tokens (id, access_token, refresh_token, access_exp, refresh_exp)
    VALUES (1, $1, $2, $3, $4)
    ON CONFLICT (id) DO UPDATE SET
      access_token  = EXCLUDED.access_token,
      refresh_token = EXCLUDED.refresh_token,
      access_exp    = EXCLUDED.access_exp,
      refresh_exp   = EXCLUDED.refresh_exp
  `, [data.access, data.refresh, accessExp, refreshExp]);
}

async function authHeader() {
  return { Authorization: `Bearer ${await getAccessToken()}` };
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
  const { data } = await axios.get(`${BASE}/requisitions/${id}/`, { headers: await authHeader() });
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
  const params  = dateFrom ? { date_from: dateFrom } : {};
  const { data } = await axios.get(`${BASE}/accounts/${accountId}/transactions/`, { headers, params });
  return data.transactions || { booked: [], pending: [] };
}

module.exports = { createRequisition, getRequisition, getAccountDetails, getTransactions };
