jest.mock("../prismaClient", () => ({
  task: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  status: {
    findUnique: jest.fn(),
  },
  category: {
    findMany: jest.fn(),
  },
  user: {
    findMany: jest.fn(),
  },
  admin: {
    findMany: jest.fn(),
  },
  $transaction: jest.fn(),
}));

const prisma = require("../prismaClient");
const taskRepository = require("../repository/Task/taskRepository");

beforeEach(() => {
  jest.clearAllMocks();
  // createTask passes a callback to $transaction, so invoke it with prisma as `tx`.
  prisma.$transaction.mockImplementation(async (fn) => fn(prisma));
});

describe("createTask", () => {
  it("creates the task in a transaction with createdBy and nested relations", async () => {
    const created = { id: "t1" };
    prisma.task.create.mockResolvedValue(created);

    const result = await taskRepository.createTask({
      title: "Task",
      statusId: "s1",
      categories: ["c1", "c2"],
      assignments: [{ assignableType: "USER", assignableId: "u1" }],
      createdBy: { type: "USER", id: "u1" },
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.task.create).toHaveBeenCalledWith({
      data: {
        title: "Task",
        statusId: "s1",
        createdByType: "USER",
        createdById: "u1",
        categories: { create: [{ categoryId: "c1" }, { categoryId: "c2" }] },
        assignments: {
          create: [{ assignableType: "USER", assignableId: "u1" }],
        },
      },
      include: expect.any(Object),
    });
    expect(result).toBe(created);
  });

  it("defaults categories and assignments to empty arrays", async () => {
    prisma.task.create.mockResolvedValue({});

    await taskRepository.createTask({
      title: "T",
      statusId: "s1",
      createdBy: { type: "USER", id: "u1" },
    });

    const data = prisma.task.create.mock.calls[0][0].data;
    expect(data.categories).toEqual({ create: [] });
    expect(data.assignments).toEqual({ create: [] });
  });
});

describe("getTaskById", () => {
  it("excludes soft-deleted tasks and includes relations", async () => {
    prisma.task.findFirst.mockResolvedValue({ id: "t1" });

    await taskRepository.getTaskById("t1");

    expect(prisma.task.findFirst).toHaveBeenCalledWith({
      where: { id: "t1", deletedAt: null },
      include: expect.any(Object),
    });
  });
});

describe("getTasks", () => {
  it("always filters out soft-deleted tasks and orders newest first", async () => {
    prisma.task.findMany.mockResolvedValue([]);

    await taskRepository.getTasks();

    const arg = prisma.task.findMany.mock.calls[0][0];
    expect(arg.where).toEqual({ deletedAt: null });
    expect(arg.orderBy).toEqual({ createDate: "desc" });
    expect(arg.include).toEqual(expect.any(Object));
  });

  it("applies a statusId filter", async () => {
    prisma.task.findMany.mockResolvedValue([]);

    await taskRepository.getTasks({ statusId: "s1" });

    expect(prisma.task.findMany.mock.calls[0][0].where.statusId).toBe("s1");
  });

  it("applies a creator filter as a pair", async () => {
    prisma.task.findMany.mockResolvedValue([]);

    await taskRepository.getTasks({ createdById: "u1", createdByType: "USER" });

    const where = prisma.task.findMany.mock.calls[0][0].where;
    expect(where.createdById).toBe("u1");
    expect(where.createdByType).toBe("USER");
  });

  it("applies an endFlag filter", async () => {
    prisma.task.findMany.mockResolvedValue([]);

    await taskRepository.getTasks({ endFlag: true });

    expect(prisma.task.findMany.mock.calls[0][0].where.endFlag).toBe(true);
  });
});

describe("getStatusByCode", () => {
  it("finds a status by its unique code", async () => {
    prisma.status.findUnique.mockResolvedValue({ id: "s1", code: "PENDING" });

    const result = await taskRepository.getStatusByCode("PENDING");

    expect(prisma.status.findUnique).toHaveBeenCalledWith({
      where: { code: "PENDING" },
    });
    expect(result).toEqual({ id: "s1", code: "PENDING" });
  });
});

describe("findExistingCategoryIds", () => {
  it("returns [] without querying when there is nothing to check", async () => {
    const result = await taskRepository.findExistingCategoryIds([]);

    expect(result).toEqual([]);
    expect(prisma.category.findMany).not.toHaveBeenCalled();
  });

  it("returns only the IDs that exist", async () => {
    prisma.category.findMany.mockResolvedValue([{ id: "c1" }]);

    const result = await taskRepository.findExistingCategoryIds(["c1", "c2"]);

    expect(result).toEqual(["c1"]);
  });
});

describe("findExistingAssignables", () => {
  it("returns [] without querying when there is nothing to check", async () => {
    const result = await taskRepository.findExistingAssignables([]);

    expect(result).toEqual([]);
    expect(prisma.user.findMany).not.toHaveBeenCalled();
    expect(prisma.admin.findMany).not.toHaveBeenCalled();
  });

  it("checks both users and admins", async () => {
    prisma.user.findMany.mockResolvedValue([{ id: "u1" }]);
    prisma.admin.findMany.mockResolvedValue([{ id: "a1" }]);

    const result = await taskRepository.findExistingAssignables([
      { assignableType: "USER", assignableId: "u1" },
    ]);

    expect(prisma.user.findMany).toHaveBeenCalled();
    expect(prisma.admin.findMany).toHaveBeenCalled();
    expect(result).toEqual(["u1", "a1"]);
  });
});

describe("updateTask", () => {
  it("updates by id and includes relations", async () => {
    prisma.task.update.mockResolvedValue({ id: "t1" });

    await taskRepository.updateTask("t1", { title: "New" });

    expect(prisma.task.update).toHaveBeenCalledWith({
      where: { id: "t1" },
      data: { title: "New" },
      include: expect.any(Object),
    });
  });
});

describe("deleteTask", () => {
  it("soft-deletes by stamping deletedAt", async () => {
    prisma.task.update.mockResolvedValue({});

    await taskRepository.deleteTask("t1");

    expect(prisma.task.update).toHaveBeenCalledWith({
      where: { id: "t1" },
      data: { deletedAt: expect.any(Date) },
    });
  });
});
