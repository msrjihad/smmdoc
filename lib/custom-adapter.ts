import { Adapter, AdapterAccount, AdapterUser, VerificationToken } from 'next-auth/adapters'
import { db } from '@/lib/db'
import { processAffiliateReferral } from '@/lib/affiliate-referral-helper'

const toAdapterUser = (u: any): AdapterUser => ({
  id: String(u.id),
  name: u.name || null,
  email: u.email || null,
  emailVerified: u.emailVerified || null,
  image: u.image || null,
})

export const CustomAdapter = (): Adapter => ({
  createUser: async (data) => {
    const username = data.email ? data.email.split('@')[0] : `user${Date.now()}`
    const u = await db.users.create({
      data: {
        email: data.email || null,
        name: data.name || username,
        image: data.image || null,
        username,
        role: 'user',
        status: 'active',
      },
    })
    
    processAffiliateReferral(u.id).catch(err => {
      console.error('Error processing affiliate referral in createUser:', err)
    })
    
    return toAdapterUser(u)
  },
  getUser: async (id) => {
    const u = await db.users.findUnique({ where: { id: typeof id === 'string' ? parseInt(id) : id as any } })
    return u ? toAdapterUser(u) : null
  },
  getUserByEmail: async (email) => {
    if (!email) return null
    const u = await db.users.findUnique({ where: { email } })
    return u ? toAdapterUser(u) : null
  },
  getUserByAccount: async ({ provider, providerAccountId }) => {
    const acc = await db.accounts.findUnique({ where: { provider_providerAccountId: { provider, providerAccountId } } })
    if (!acc) return null
    const u = await db.users.findUnique({ where: { id: acc.userId } })
    return u ? toAdapterUser(u) : null
  },
  updateUser: async (data) => {
    const idNum = typeof data.id === 'string' ? parseInt(data.id) : (data.id as any)
    const u = await db.users.update({
      where: { id: idNum },
      data: { name: data.name || undefined, email: data.email || undefined, image: data.image || undefined },
    })
    return toAdapterUser(u)
  },
  deleteUser: async (id) => {
    await db.users.delete({ where: { id: typeof id === 'string' ? parseInt(id) : id as any } })
  },
  linkAccount: async (account) => {
    const idNum = typeof account.userId === 'string' ? parseInt(account.userId) : (account.userId as any)
    const acc = await db.accounts.create({
      data: {
        userId: idNum,
        type: account.type,
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        refresh_token: account.refresh_token || null,
        access_token: account.access_token || null,
        expires_at: account.expires_at || null,
        token_type: account.token_type || null,
        scope: account.scope || null,
        id_token: account.id_token || null,
        session_state: account.session_state ? String(account.session_state) : null,
        refresh_token_expires_in: typeof account.refresh_token_expires_in === 'number' ? account.refresh_token_expires_in : null,
      },
    })
    return acc as unknown as AdapterAccount
  },
  unlinkAccount: async ({ provider, providerAccountId }) => {
    await db.accounts.delete({ where: { provider_providerAccountId: { provider, providerAccountId } } })
  },
  createSession: async () => {
    return null as any
  },
  getSessionAndUser: async () => {
    return null as any
  },
  updateSession: async () => {
    return null as any
  },
  deleteSession: async () => {
    return
  },
  createVerificationToken: async (token) => {
    const vt = await db.verificationTokens.create({ 
      data: { 
        email: (token as any).email || token.identifier || '', 
        token: token.token, 
        expires: token.expires 
      } 
    })
    return { identifier: vt.email, token: vt.token, expires: vt.expires } as VerificationToken
  },
  useVerificationToken: async ({ identifier, token }) => {
    const vt = await db.verificationTokens.findUnique({ where: { email_token: { email: identifier, token } } })
    if (!vt) return null
    await db.verificationTokens.delete({ where: { email_token: { email: identifier, token } } })
    return { identifier: vt.email, token: vt.token, expires: vt.expires } as VerificationToken
  },
})