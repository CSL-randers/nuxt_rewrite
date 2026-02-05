import { asc } from 'drizzle-orm'
import { account } from '~/lib/db/schema/index'
import db from '~/lib/db'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'private, max-age=0, must-revalidate')

  const storage = useStorage('bank-accounts')
  const cached = await storage.getItem('list')
  if (cached) { return cached }

  const accounts = await db.select().from(account).orderBy(asc(account.id))

  await storage.setItem('list', accounts, { ttl: 60 })

  return accounts
})
