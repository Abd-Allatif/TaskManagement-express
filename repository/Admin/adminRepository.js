const prisma = require("../../prismaClient");

const findByEmail = (email) => prisma.admin.findUnique({ where: { email } });

const findByEmailWithTokens = (email) =>
  prisma.admin.findUnique({
    where: { email },
    include: { adminVerificationTokens: true },
  });

const createAdmin = (data) => prisma.admin.create({ data });

const createVerificationToken = (data) =>
  prisma.adminVerificationToken.create({ data });

const consumeVerificationToken = (adminId, tokenId) =>
  prisma.$transaction([
    prisma.admin.update({
      where: { id: adminId },
      data: { emailVerifiedAt: new Date() },
    }),
    prisma.adminVerificationToken.delete({ where: { id: tokenId } }),
  ]);

module.exports = {
  findByEmail,
  findByEmailWithTokens,
  createAdmin,
  createVerificationToken,
  consumeVerificationToken,
};
