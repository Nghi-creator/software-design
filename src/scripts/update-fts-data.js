import db from "../utils/db.js";

const BATCH_SIZE = 1000;
const DELAY_MS = 500;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function updateFTSData() {
  try {
    const { min_id, max_id } = await db("products")
      .min("id as min_id")
      .max("id as max_id")
      .first();

    if (!min_id || !max_id) {
      console.log("⚠️ Không có sản phẩm nào trong Database.");
      return;
    }

    let currentId = min_id;
    while (currentId <= max_id) {
      const endId = currentId + BATCH_SIZE - 1;

      console.log(`⏳ Đang cập nhật lô ID từ ${currentId} đến ${endId}...`);

      await db.raw(
        `
        UPDATE products 
        SET fts = to_tsvector('simple', remove_accents(name))
        WHERE id >= ? AND id <= ?
      `,
        [currentId, endId],
      );

      currentId += BATCH_SIZE;
      if (currentId <= max_id) {
        await sleep(DELAY_MS);
      }
    }
  } catch (error) {
    console.error("Đã xảy ra lỗi trong quá trình cập nhật FTS:", error);
  } finally {
    await db.destroy();
  }
}

if (process.argv[1].endsWith("update-fts-data.js")) {
  updateFTSData().then(() => {
    process.exit(0);
  });
}
