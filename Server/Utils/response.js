// utils/response.js

function ok(res, data = {}, meta = {}) {
  return res.json({
    success: true,
    data,
    meta
  });
}

function error(res, message = "error", code = 400) {
  return res.status(code).json({
    success: false,
    error: message
  });
}

module.exports = { ok, error };
