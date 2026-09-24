import { prisma } from "@/lib/prisma";

export async function getAddresses(userId: string) {
  return prisma.address.findMany({ where: { userId }, orderBy: { isDefault: "desc" } });
}

export async function getAddressForUser(userId: string, addressId: string) {
  return prisma.address.findFirst({ where: { id: addressId, userId } });
}

export async function createAddress(
  userId: string,
  data: { name: string; phone: string; line1: string; city: string; state: string; zip: string }
) {
  return prisma.address.create({ data: { ...data, userId } });
}
