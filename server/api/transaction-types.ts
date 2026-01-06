import type { TransactionType } from '~/types'

// Mock data for transaction types
const transactionTypes: TransactionType[] = [
    { id: 'CAP' },
    { id: 'BGS' },
    { id: 'DANKORT-SALG' },
    { id: 'OVERFØRSEL' },
    { id: 'UDLANDSOVERFØRSEL' },
]

export default cachedEventHandler(
  async (event) => {
    setHeader(event, 'X-Cache', 'HIT')
    return await transactionTypes
  },
  { maxAge: 120 }
)
