import { prisma } from "@/lib/prisma";

export async function getAddresses(userId: string) {
  return prisma.address.findMany({ where: { userId }, orderBy: { isDefault: "desc" } });
}

export async function getAddressForUser(userId: string, addressId: string) {
  return prisma.address.findFirst({ where: { id: addressId, userId } });
}
