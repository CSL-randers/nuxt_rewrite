import type { Rule } from '~/lib/db/schema.ts'

// Mock data for rules
const rules: Rule[] = [
    {
        id: 0,
        type: 'standard',
        status: 'aktiv',
        relatedBankAccounts: [ 'DK2000945604564-DKK', 'DK2000945604565-DKK' ],
        lastUsed: new Date('2023-07-31'),
        createdAt: new Date('2022-12-21'),
        updatedAt: new Date('2023-02-05'),
        matchText: [ 'BDP-' ],
        matchCounterparty: [ 'Udbetaling Danmark' ],
        matchType: [ 'Overførsel', 'BGS' ],
        matchAmountMin: undefined,
        matchAmountMax: undefined,
        accountingPrimaryAccount: '95990009',
        accountingSecondaryAccount: undefined,
        accountingTertiaryAccount: undefined,
        accountingText: 'Barselsdagpengerefusion',
        accountingCprType: 'ingen',
        accountingCprNumber: undefined,
        accountingNotifyTo: 'csl@randers.dk',
        accountingNote: 'S-2025 3240',
        accountingAttachmentName: undefined,
        accountingAttachmentMimetype: undefined,
        accountingAttachmentData: undefined,
        ruleTags: [{
            id: 0,
            name: 'Refusion'
        }],
    }, {
        id: 1,
        type: 'engangs',
        status: 'inaktiv',
        relatedBankAccounts: [ 'DK2000945604564-DKK' ],
        lastUsed: undefined,
        createdAt: new Date('2022-12-21'),
        updatedAt: new Date('2022-12-21'),
        matchText: [ 'Mellerup', 'Kontant' ],
        matchCounterparty: undefined,
        matchType: [ 'Indbetaling' ],
        matchAmountMin: undefined,
        matchAmountMax: 4000,
        accountingPrimaryAccount: '79000000',
        accountingSecondaryAccount: 'XG-0000000006-00020',
        accountingTertiaryAccount: undefined,
        accountingText: 'Kontant indbetaling - Mellerup',
        accountingCprType: 'ingen',
        accountingCprNumber: undefined,
        accountingNotifyTo: 'csl@randers.dk',
        accountingNote: 'Mellerup',
        accountingAttachmentName: undefined,
        accountingAttachmentMimetype: undefined,
        accountingAttachmentData: undefined,
        ruleTags: [{
            id: 1,
            name: 'Kontantindbetaling'
        }],
    }, {
        id: 2,
        type: 'undtagelse',
        status: 'aktiv',
        relatedBankAccounts: [ 'DK2000945604564-DKK' ],
        lastUsed: new Date('2023-01-02'),
        createdAt: new Date('2022-12-21'),
        updatedAt: new Date('2022-12-21'),
        matchText: undefined,
        matchCounterparty: undefined,
        matchType: [ 'Rente' ],
        matchAmountMin: undefined,
        matchAmountMax: undefined,
        accountingPrimaryAccount: undefined,
        accountingSecondaryAccount: undefined,
        accountingTertiaryAccount: undefined,
        accountingText: undefined,
        accountingCprType: 'ingen',
        accountingCprNumber: undefined,
        accountingNotifyTo: 'csl@randers.dk',
        accountingNote: 'Koncern renteudligning',
        accountingAttachmentName: undefined,
        accountingAttachmentMimetype: undefined,
        accountingAttachmentData: undefined,
        ruleTags: [{
            id: 2,
            name: 'Renter'
        }],
    }
]

export default cachedEventHandler(
  async (event) => {
    setHeader(event, 'X-Cache', 'HIT')
    return await rules
  },
  { maxAge: 120 }
)

