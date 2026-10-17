const express = require("express");
const verifyToken = require("../../middleware/auth");
const {
  createTask,
  getTaskById,
  getTasks,
  updateTask,
  deleteTask,
} = require("../../controllers/Task/taskController");
const { createTaskRules, validate } = require("../../middleware/validators/taskValidators");

const router = express.Router();

// All task routes require authentication
router.use(verifyToken);

// Create
router.post("/", createTaskRules, validate, createTask);

// Read
router.get("/", getTasks);
router.get("/:id", getTaskById);

// Update
router.put("/:id",createTaskRules,validate , updateTask);

// Delete (soft)
router.delete("/:id", deleteTask);

module.exports = router;
