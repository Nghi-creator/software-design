import fs from "fs";
import path from "path";

export const FileService = {
  moveAndRenameProductImages: (productId, thumbnailName, subImagesArray) => {
    const dirPath = path
      .join("public", "images", "products")
      .replace(/\\/g, "/");

    const mainPath = path
      .join(dirPath, `p${productId}_thumb.jpg`)
      .replace(/\\/g, "/");
    const oldMainPath = path
      .join("public", "uploads", path.basename(thumbnailName))
      .replace(/\\/g, "/");
    const savedMainPath =
      "/" +
      path
        .join("images", "products", `p${productId}_thumb.jpg`)
        .replace(/\\/g, "/");

    if (fs.existsSync(oldMainPath)) fs.renameSync(oldMainPath, mainPath);

    let newImgPaths = [];
    let i = 1;
    for (const imgPath of subImagesArray) {
      const oldPath = path
        .join("public", "uploads", path.basename(imgPath))
        .replace(/\\/g, "/");
      const newPath = path
        .join(dirPath, `p${productId}_${i}.jpg`)
        .replace(/\\/g, "/");
      const savedPath =
        "/" +
        path
          .join("images", "products", `p${productId}_${i}.jpg`)
          .replace(/\\/g, "/");

      if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
        newImgPaths.push({ product_id: productId, img_link: savedPath });
        i++;
      }
    }
    return { savedMainPath, newImgPaths };
  },
};
