import type { AccountInsertSchema } from '~/lib/db/schema/index'

    const bankAccounts = [
      { id: 'DK2000945604564-DKK', statusAccount: 90599999 },
      { id: 'DK2000945604565-DKK', statusAccount: 90599999 },
      { id: 'DK2000945604566-DKK', statusAccount: 90599999 },
      { id: 'DK2000945604567-DKK', statusAccount: 90599999 }
    ] as AccountInsertSchema[]

export default cachedEventHandler(
  async (event) => {
    setHeader(event, 'X-Cache', 'HIT')
    return await bankAccounts
  },
  { maxAge: 120 }
)
