import type { Run } from '~/types'
import type { Document } from '~/types'
import type { Transaction } from '~/types'

const mockBlob1 = new Blob([Buffer.from('JVBERi0xLjQKJcTl8uXrp/Og0MTGCjEgMCBvYmoKPDwvVHlwZS9DYXRhbG9nL1BhZ2VzIDIgMCBSPj4KZW5kb2JqCjIgMCBvYmoKPDwvVHlwZS9QYWdlcy9Db3VudCAxL0tpZHNbMyAwIFJdPj4KZW5kb2JqCjMgMCBvYmoKPDwvVHlwZS9QYWdlL1BhcmVudCAyIDAgUi9NZWRpYUJveFswIDAgMjAwIDIwMF0vQ29udGVudHMgNCAwIFIvUmVzb3VyY2VzPDwvRm9udDw8L0YxIDUgMCBSPj4+Pj4+PgplbmRvYmoKNCAwIG9iago8PC9MZW5ndGggNDQ+PnN0cmVhbQpCVCAvRjEgMTIgVGYgNTAgMTUwIFRkIChNb2NrIFBERikgVGoKRVQKZW5kc3RyZWFtCmVuZG9iago1IDAgb2JqCjw8L1R5cGUvRm9udC9TdWJ0eXBlL1R5cGUxL0Jhc2VGb250L0hlbHZldGljYT4+CmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYKMDAwMDAwMDA5MCAwMDAwMCBuCjAwMDAwMDAxNTMgMDAwMDAgbgowMDAwMDAwMjQwIDAwMDAwIG4KMDAwMDAwMDM0MCAwMDAwMCBuCjAwMDAwMDA0MjAgMDAwMDAgbgplbmR4cmVmCjQ5MQolJUVPRgo=', 'base64')], { type: 'application/pdf' })

const mockBlob2 = new Blob([Buffer.from('aWQsbmFtZSxhbW91bnQKMSxUZXN0LDEwMAoyLE1vY2ssMjAw', 'base64')], { type: 'text/csv' })

const mockDocument1: Document = {
    id: 'asda01',
    type: 'postering',
    bookingDate: new Date('2025-09-15'),
    content: mockBlob1,
    filename: 'postering.pdf',
    mimetype: 'pdf',
}

const mockDocument2: Document = {
    id: 'asda02',
    type: 'postering',
    bookingDate: new Date('2025-09-14'),
    content: mockBlob2,
    filename: 'bilag.csv',
    mimetype: 'csv',
}

const mockTransactions: Transaction[] = [
    {
        id: '0000954427',
        bookingDate: new Date('2025-09-13'),
        bankAccount: 'DK20005908764988-DKK',
        bankAccountName: 'Hovedkonto',
        counterpart: null,
        amount: -4588.42,
        transactionType: 'CAP',
        references: [ 'NKS-KY' ],
        ruleApplied: 13,
        status: 'bogført',
    },
    {
        id: '0000954425',
        bookingDate: new Date('2025-09-13'),
        bankAccount: 'DK20009042714507-DKK',
        bankAccountName: 'Kreditorkonto',
        counterpart: 'PARKMAN OY',
        amount: 5038.75,
        transactionType: 'BGS',
        references: [ 'Parkman 08/2025', 'Kundennr: 10000322' ],
        ruleApplied: null,
        status: 'åben',
    },
    {
        id: '0000954419',
        bookingDate: new Date('2025-09-13'),
        bankAccount: 'DK20005908764988-DKK',
        bankAccountName: 'Hovedkonto',
        counterpart: null,
        amount: 315.00,
        transactionType: 'DANKORT-SALG',
        references: [ 'Dankort-salg 12.09 6899625 242050' ],
        ruleApplied: null,
        status: 'åben',
    }
]

// Mock data for runs
const runs: Run[] = [
    {
        bookingDate: new Date('2025-09-15'),
        status: 'afventer',
        error: null,
        transactions: null,
        docs: null,
    },
    {
        bookingDate: new Date('2025-09-14'),
        status: 'indlæser',
        error: null,
        transactions: null,
        docs: null,
    },
    {
        bookingDate: new Date('2025-09-13'),
        status: 'udført',
        error: null,
        transactions: mockTransactions,
        docs: [ mockDocument1, mockDocument2],
    },
    {
        bookingDate: new Date('2025-09-12'),
        status: 'fejl',
        error: [ 'Fejl ved hentning af transaktioner fra bank', 'Fejl ved oprettelse af dokumenter' ],
        transactions: null,
        docs: null,
    }
]

export default cachedEventHandler(
  async (event) => {
    setHeader(event, 'X-Cache', 'HIT')
    return await runs
  },
  { maxAge: 120 }
)