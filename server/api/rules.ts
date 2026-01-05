import type { Rule } from '~/types'

// Mock data for rules
const rules: Rule[] = [
    {
        id: 0,
        type: 'standard',
        status: 'aktiv',
        bankAccountName: 'Hovedkonto',
        lastUsed: new Date('2023-07-31'),
        createdAt: new Date('2022-12-21'),
        updatedAt: new Date('2023-02-05'),
        matchText: [ 'BDP-' ],
        matchCounterparty: [ 'Udbetaling Danmark' ],
        matchType: 'Overførsel',
        matchAmountMin: null,
        matchAmountMax: null,
        accountingPrimaryAccount: '95990009',
        accountingSecondaryAccount: null,
        accountingTertiaryAccount: null,
        accountingText: 'Barselsdagpengerefusion',
        accountingCprType: 'ingen',
        accountingCprNumber: null,
        accountingNotifyTo: 'csl@randers.dk',
        accountingNote: 'S-2025 3240',
        accountingAttachmentName: null,
        accountingAttachmentMimetype: null,
        accountingAttachmentData: null,
        ruleTags: [{
            id: 0,
            name: 'Refusion'
        }],
    }, {
        id: 1,
        type: 'engangs',
        status: 'inaktiv',
        bankAccountName: 'Mellerup',
        lastUsed: null,
        createdAt: new Date('2022-12-21'),
        updatedAt: null,
        matchText: [ 'Mellerup', 'Kontant' ],
        matchCounterparty: null,
        matchType: 'Indbetaling',
        matchAmountMin: null,
        matchAmountMax: 4000,
        accountingPrimaryAccount: '79000000',
        accountingSecondaryAccount: 'XG-0000000006-00020',
        accountingTertiaryAccount: null,
        accountingText: 'Kontant indbetaling - Mellerup',
        accountingCprType: 'ingen',
        accountingCprNumber: null,
        accountingNotifyTo: 'csl@randers.dk',
        accountingNote: 'Mellerup',
        accountingAttachmentName: null,
        accountingAttachmentMimetype: null,
        accountingAttachmentData: null,
        ruleTags: [{
            id: 1,
            name: 'Kontantindbetaling'
        }],
    }, {
        id: 2,
        type: 'undtagelse',
        status: 'aktiv',
        bankAccountName: 'Hovedkonto',
        lastUsed: new Date('2023-01-02'),
        createdAt: new Date('2022-12-21'),
        updatedAt: null,
        matchText: null,
        matchCounterparty: null,
        matchType: 'Rente',
        matchAmountMin: null,
        matchAmountMax: null,
        accountingPrimaryAccount: null,
        accountingSecondaryAccount: null,
        accountingTertiaryAccount: null,
        accountingText: null,
        accountingCprType: 'ingen',
        accountingCprNumber: null,
        accountingNotifyTo: 'csl@randers.dk',
        accountingNote: 'Koncern renteudligning',
        accountingAttachmentName: null,
        accountingAttachmentMimetype: null,
        accountingAttachmentData: null,
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

