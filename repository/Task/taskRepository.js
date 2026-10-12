const prisma = require("../../prismaClient");

// this ensures evert task fetch returns its relatkionships consistently
const taskInclude = {
  status: true,
  assignments: true,
  categories: { include: { category: true } },
  subTasks: true,
};

// CRUD

// Create
const createTask = async (data) => {
  // destructure the data to separate out the relationships from the task data
  // Where taskData is the column that lives dricetly on the task table, and the rest are relationships that need to be created separately
  // CreatedBy -- {type, id}
  const { categories = [], assignments = [], createdBy, ...taskData } = data;

  return prisma.$transaction(async (tx) => {
    const task = await tx.task.create({
      data: {
        ...taskData,
        createdByType: createdBy.type,
        createdById: createdBy.id,
        categories: {
          create: categories.map((categoryId) => ({ categoryId })),
        },
        assignments: {
          create: assignments.map(({ assignableType, assignableId }) => ({
            assignableType,
            assignableId,
          })),
        },
      },
      include: taskInclude,
    });
    return task;
  });
};

// Read

const getTaskById = async (id) => {
  return prisma.task.findFirst({
    where: { id, deletedAt: null },
    include: taskInclude,
  });
};

const getTasks = async (filters = {}) => {
  return prisma.task.findMany({
    where: {
      deletedAt: null,
      ...(filters.statusId && { statusId: filters.statusId }),
      ...(filters.createdById && {
        createdById: filters.createdById,
        createdByType: filters.createdByType,
      }),
      ...(filters.endFlag !== undefined && { endFlag: filters.endFlag }),
    },
    include: taskInclude,
    orderBy: {
      createDate: "desc",
    },
  });
};

const getStatusByCode = (code) => prisma.status.findUnique({ where: { code } });

const findExistingCategoryIds = async (ids) => {
  if (!ids?.length) return [];

  const found = await prisma.category.findMany({
    where: { id: { in: ids } },
    select: { id: true },
  });

  return found.map((c) => c.id);
};

const findExistingAssingables = async (assignments) => {
  if(!assignments?.length) return [];

  const users = await prisma.user.findMany({
    where: {id: {in: assignments.map((a) => a.assignableId)}},
    select: {id: true}
  });
  const admins = await prisma.admin.findMany({
    where: {id: {in: assignments.map((a) => a.assignableId)}},
    select: {id: true}
  });

  return [...users, ...admins].map((a) => a.id);
};

// Update

const updateTask = async (id, data) => {
  return prisma.task.update({
    where: { id },
    data: data,
    include: taskInclude,
  });
};

// Soft Delete
const deleteTask = async (id) => {
  return prisma.task.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
};

module.exports = {
  createTask,
  getTaskById,
  getTasks,
  getStatusByCode,
  findExistingCategoryIds,
  findExistingAssingables,
  updateTask,
  deleteTask,
  taskInclude,
};
