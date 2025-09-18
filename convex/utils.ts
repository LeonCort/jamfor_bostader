export async function getUserIdOrThrow(ctx: any): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");
  // For Clerk, subject is the Clerk user ID
  return identity.subject;
}

