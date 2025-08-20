const db = require("../config/db.config");

/**
 * Aggregate incoming PO details by product
 * @param {Array<{product_id:string, quantity:number, price:number}>} details
 * @returns {Array<{product_id:string, qty_in:number, avg_unit_cost:number}>}
 */
function aggregateIncoming(details = []) {
  const map = new Map();
  for (const d of details) {
    const productId = d.product_id;
    const qty = Number(d.quantity) || 0;
    const price = Number(d.price) || 0;
    if (!productId || qty <= 0) continue;
    if (!map.has(productId)) {
      map.set(productId, { product_id: productId, qty_in: 0, total_cost: 0 });
    }
    const acc = map.get(productId);
    acc.qty_in += qty;
    acc.total_cost += qty * price; // price là giá nhập thuần
  }
  return Array.from(map.values()).map((it) => ({
    product_id: it.product_id,
    qty_in: it.qty_in,
    avg_unit_cost: it.qty_in > 0 ? it.total_cost / it.qty_in : 0,
  }));
}

/**
 * Apply Weighted Average Cost (WAC) for a list of incoming products BEFORE stock increase
 * - Đọc tổng tồn cũ (tổng trên mọi kho) từ inventories
 * - Đọc cost_price cũ từ products (FOR UPDATE)
 * - Tính cost_price mới và cập nhật
 * - Sync total_value trong inventories cho tất cả kho có sản phẩm này
 *
 * @param {Array<{product_id:string, quantity:number, price:number}>} details
 * @returns {Promise<Array<{product_id:string, old_cost:number, new_cost:number, qty_old:number, qty_in:number}>>}
 */
async function applyWACForPurchase(details = []) {
  if (!Array.isArray(details) || details.length === 0) return [];

  const incoming = aggregateIncoming(details).filter((i) => i.qty_in > 0);
  if (incoming.length === 0) return [];

  const conn = await db.promise().getConnection();
  const updates = [];
  try {
    await conn.beginTransaction();

    for (const item of incoming) {
      const { product_id, qty_in, avg_unit_cost } = item;
      if (!product_id || qty_in <= 0) continue;

      // 1) Tổng tồn cũ trên mọi kho
      const [stockRows] = await conn.query(
        `SELECT IFNULL(SUM(quantity), 0) AS qty_old FROM inventories WHERE product_id = ?`,
        [product_id]
      );
      const qty_old = Number(stockRows[0]?.qty_old || 0);

      // 2) cost_price hiện tại (khóa row để tránh race condition)
      const [prodRows] = await conn.query(
        `SELECT cost_price FROM products WHERE product_id = ? FOR UPDATE`,
        [product_id]
      );
      const old_cost = Number(prodRows[0]?.cost_price || 0);

      // 3) Tính WAC
      let new_cost = old_cost;
      if (qty_old <= 0) {
        new_cost = avg_unit_cost; // lần nhập đầu
      } else {
        new_cost = (qty_old * old_cost + qty_in * avg_unit_cost) / (qty_old + qty_in);
      }

      // Làm tròn 4 chữ số thập phân để ổn định
      new_cost = Math.round(new_cost * 10000) / 10000;

      // 4) Cập nhật products.cost_price
      await conn.query(
        `UPDATE products SET cost_price = ? WHERE product_id = ?`,
        [new_cost, product_id]
      );

      // 5) Sync total_value trong inventories cho tất cả kho có sản phẩm này
      await conn.query(
        `UPDATE inventories SET total_value = quantity * ? WHERE product_id = ?`,
        [new_cost, product_id]
      );

      updates.push({
        product_id,
        old_cost,
        new_cost,
        qty_old,
        qty_in,
      });
    }

    await conn.commit();
    return updates;
  } catch (err) {
    try { await conn.rollback(); } catch(_) {}
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = {
  applyWACForPurchase,
  aggregateIncoming,
}; 