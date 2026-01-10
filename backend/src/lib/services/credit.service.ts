import prisma from "@/lib/db";

export async function getUsage(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      creditsRemaining: true,
      planStatus: true,
    },
  });

  if (!user) throw new Error("User not found");

  return user;
}

export async function checkCredits(userId: string): Promise<boolean> {
  const { creditsRemaining, planStatus } = await getUsage(userId);
  return planStatus !== "FREE" || creditsRemaining > 0;
}

export async function incrementUsage(userId: string, amount = 1) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      creditsRemaining: {
        decrement: amount,
      },
    },
  });
}
