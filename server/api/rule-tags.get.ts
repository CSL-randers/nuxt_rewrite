import { ruleTagSelectSchema, ruleTag } from '~/lib/db/schema'
import db from '~/lib/db'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'private, max-age=60')

  const rows = await db.query.ruleTag.findMany({
    columns: {
      id: true
    }
  })

  return ruleTagSelectSchema.array().parse(rows)
})