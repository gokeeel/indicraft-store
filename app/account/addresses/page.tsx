import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AddressManager } from "@/components/account/AddressManager";

export default async function AddressesPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/login");

  const addresses = await prisma.address.findMany({ where: { userId }, orderBy: { isDefault: "desc" } });

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">Your Addresses</h1>
      <AddressManager addresses={addresses} />
    </div>
  );
}
