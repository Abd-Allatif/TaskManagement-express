const prisma = require("../../prismaClient");

const findByEmail = (email) => prisma.user.findUnique({ where: { email } });

const findByEmailWithTokens = (email) =>
  prisma.user.findUnique({
    where: { email },
    include: { verificationTokens: true },
  });

const createUser = (data) => prisma.user.create({ data });

const createVerificationToken = (data) =>
  prisma.verificationToken.create({ data });

const markEmailVerified = (userId) =>
  prisma.user.update({
    where: { id: userId },
    data: { emailVerifiedAt: new Date() },
  });

const deleteVerificationToken = (tokenId) =>
  prisma.verificationToken.delete({ where: { id: tokenId } });

const consumeVerificationToken = (userId, tokenId) =>
  prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { emailVerifiedAt: new Date() },
    }),
    prisma.verificationToken.delete({ where: { id: tokenId } }),
  ]);

module.exports = {
  findByEmail,
  findByEmailWithTokens,
  createUser,
  createVerificationToken,
  markEmailVerified,
  deleteVerificationToken,
  consumeVerificationToken,
};
