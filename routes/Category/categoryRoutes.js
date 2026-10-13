const express = require("express");
const verifyToken = require("../../middleware/auth");
const {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = require("../../controllers/Category/categoryController");
const {
  createCategoryRules,
  updateCategoryRules,
  validate,
} = require("../../middleware/validators/categoryValidators");

const router = express.Router();

router.use(verifyToken);

router.post("/", createCategoryRules, validate, createCategory);

router.get("/", getCategories);
router.get("/:id", getCategoryById);

router.put("/:id", updateCategoryRules, validate, updateCategory);

router.delete("/:id", deleteCategory);

module.exports = router;