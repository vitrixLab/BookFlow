// lib/planLimits.ts
import { prisma } from './db'

export type ResourceType = 'EMPLOYEE' | 'ADMIN' | 'CLIENT'

export async function checkPlanLimit(
  adminId: number,
  resource: ResourceType
): Promise<string | null> {
  const admin = await prisma.user.findUnique({ where: { id: adminId } })
  if (!admin) return 'Admin not found'

  // ── Get the correct limit field ────────
  let limit: number | null = null
  let roleFilter = ''

  if (resource === 'EMPLOYEE') {
    limit = admin.maxEmployees
    roleFilter = 'EMPLOYEE'
  } else if (resource === 'ADMIN') {
    limit = admin.maxAdmins
    roleFilter = 'ADMIN'
  } else if (resource === 'CLIENT') {
    limit = admin.maxClients
    roleFilter = 'CLIENT'
  }

  // Unlimited
  if (limit === null) return null

  // Count existing users of this role approved by this admin
  const count = await prisma.user.count({
    where: {
      approvedBy: adminId,
      role: roleFilter as any,
    },
  })

  if (count >= limit) {
    const friendly = resource === 'EMPLOYEE' ? 'employee' : resource === 'ADMIN' ? 'admin account' : 'client'
    return `You have reached your plan's ${friendly} limit (${limit}). Upgrade to a higher plan to add more.`
  }

  return null
}