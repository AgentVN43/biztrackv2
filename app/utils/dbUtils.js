// utils/dbUtils.js
const db = require("../config/db.config");

const getTotalCount = async (tableName, whereClause = "") => {
  try {
    const query = `SELECT COUNT(*) AS total FROM ${tableName} ${whereClause}`;
    const [results] = await db.promise().query(query);
    return results[0].total;
  } catch (error) {
    console.error(`Lỗi khi đếm tổng số từ bảng ${tableName}:`, error);
    throw error;
  }
};

const getTotalSum = async (tableName, sumColumn, whereClause = "") => {
  try {
    const query = `SELECT SUM(${sumColumn}) AS totalSum FROM ${tableName} ${whereClause}`;
    const [results] = await db.promise().query(query);
    return results[0].totalSum || 0;
  } catch (error) {
    console.error(
      `Lỗi khi tính tổng từ bảng ${tableName} cột ${sumColumn}:`,
      error
    );
    throw error;
  }
};

module.exports = { getTotalCount, getTotalSum };
