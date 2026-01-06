import type { BankAccount } from "~/types"

    const bankAccounts = [
      { id: 'DK2000945604564-DKK', name: 'Hovedkonto', statusAccount: 90599999 },
      { id: 'DK2000945604565-DKK', name: 'Mellerup', statusAccount: 90599999 },
      { id: 'DK2000945604566-DKK', name: 'Kasseordning', statusAccount: 90599999 },
      { id: 'DK2000945604567-DKK', name: 'Projektfond', statusAccount: 90599999 }
    ] as BankAccount[]

export default cachedEventHandler(
  async (event) => {
    setHeader(event, 'X-Cache', 'HIT')
    return await bankAccounts
  },
  { maxAge: 120 }
)
