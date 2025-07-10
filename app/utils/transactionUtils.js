// app/utils/transactionUtils.js
const generateTransactionCode = () => {
  const prefix = "TXN";
  const today = new Date();
  const dateStr = `${today.getFullYear()}${String(
    today.getMonth() + 1
  ).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
  const timeStr = `${String(today.getHours()).padStart(2, "0")}${String(
    today.getMinutes()
  ).padStart(2, "0")}${String(today.getSeconds()).padStart(2, "0")}`;
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();

  return `${prefix}-${dateStr}-${timeStr}-${randomStr}`;
};

module.exports = { generateTransactionCode }; 