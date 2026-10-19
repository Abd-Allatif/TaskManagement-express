const taskRepository = require("../../repository/Task/taskRepository");

// Create
const createTask = async (req, res) => {
  const {
    title,
    description,
    deadline,
    statusId,
    parentTaskId,
    categories,
    assignments,
  } = req.body;

  // Default status if not provided
  const resolvedStatusId =
    statusId || (await taskRepository.getStatusByCode("PENDING"))?.id;

  if (!resolvedStatusId) {
    return res.status(500).json({
      message: "Default status not found. Please run the seed script.",
    });
  }

  // Validate category IDs exist
  const validCategoryIds = await taskRepository.findExistingCategoryIds(categories);
  const invalidCategories = (categories || []).filter(
    (id) => !validCategoryIds.includes(id)
  );
  if (invalidCategories.length > 0) {
    return res.status(400).json({
      message: `Invalid category IDs: ${invalidCategories.join(", ")}`,
    });
  }

  // Validate assignment IDs exist
  const validAssignables = await taskRepository.findExistingAssignables(assignments);
  const invalidAssignments = (assignments || []).filter(
    (a) => !validAssignables.includes(a.assignableId)
  );
  if (invalidAssignments.length > 0) {
    return res.status(400).json({
      message: `Invalid assignable IDs: ${invalidAssignments
        .map((a) => a.assignableId)
        .join(", ")}`,
    });
  }

  const task = await taskRepository.createTask({
    title,
    description,
    deadline,
    statusId: resolvedStatusId,
    parentTaskId,
    categories: categories || [],
    assignments: assignments || [],
    createdBy: { type: "USER", id: req.user.userId },
  });

  return res.status(201).json({ message: "Task created successfully", task });
};

// Read single
const getTaskById = async (req, res) => {
  const task = await taskRepository.getTaskById(req.params.id);

  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  return res.status(200).json({ task });
};

// Read list
const getTasks = async (req, res) => {
  const { statusId, createdById, createdByType, endFlag } = req.query;

  const filters = {
    ...(statusId && { statusId }),
    ...(createdById && { createdById, createdByType }),
    ...(endFlag !== undefined && { endFlag: endFlag === "true" }),
  };

  const tasks = await taskRepository.getTasks(filters);

  return res.status(200).json({ tasks });
};

// Update
const updateTask = async (req, res) => {
  const { title, description, deadline, statusId, parentTaskId, endFlag } =
    req.body;

  const task = await taskRepository.updateTask(req.params.id, {
    title,
    description,
    deadline,
    statusId,
    parentTaskId,
    endFlag,
  });

  return res.status(200).json({ message: "Task updated successfully", task });
};

// Soft Delete
const deleteTask = async (req, res) => {
  await taskRepository.deleteTask(req.params.id);

  return res.status(200).json({ message: "Task deleted successfully" });
};

module.exports = {
  createTask,
  getTaskById,
  getTasks,
  updateTask,
  deleteTask,
};
