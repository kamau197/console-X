// utils/paystack.js
const axios = require("axios");

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

async function initPayment(email, amount, metadata = {}) {
  return axios.post(
    "https://api.paystack.co/transaction/initialize",
    { email, amount, metadata },
    {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json"
      }
    }
  );
}

async function verifyPayment(reference) {
  return axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`
    }
  });
}

module.exports = {
  initPayment,
  verifyPayment
};
