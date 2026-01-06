export const RuleStatusValues = ['aktiv', 'inaktiv'] as const
export type RuleStatus = typeof RuleStatusValues[number]

export const RuleTypeValues = ['standard', 'undtagelse', 'engangs'] as const
export type RuleType = typeof RuleTypeValues[number]

export const CprTypeValues = ['ingen', 'statisk', 'dynamisk'] as const
export type CprType = typeof CprTypeValues[number]

export type RunStatus = 'afventer' | 'indlæser' | 'udført' | 'fejl'
export type DocumentType = 'afstemning' | 'postering'
export type ErpSupplier = 'KMD' | 'andet'
export type BookingStatus = 'bogført' | 'åben'

export interface RuleTag {
    id: number
    name: string
}

export interface BankAccount {
    id: string
    name: string
    statusAccount: number
}

export interface Rule {
    id: number
    type: RuleType
    status: RuleStatus
    relatedBankAccounts: Array<BankAccount['id']>
    lastUsed: Run['bookingDate'] | undefined
    createdAt: Date
    updatedAt: Date | undefined
    matchText: Array<string> | undefined
    matchCounterparty: Array<string> | undefined
    matchType: Array<string> | undefined
    matchAmountMin: number | undefined
    matchAmountMax: number | undefined
    accountingPrimaryAccount: string | undefined // Artskonto i Opus
    accountingSecondaryAccount: string | undefined // PSP-element i Opus
    accountingTertiaryAccount: string | undefined // Omkostningssted i Opus
    accountingText: string | undefined
    accountingCprType: CprType
    accountingCprNumber: string | undefined
    accountingNotifyTo: string | undefined
    accountingNote: string | undefined
    accountingAttachmentName: string | undefined
    accountingAttachmentMimetype: string | undefined
    accountingAttachmentData: string | undefined // Base64 encoded
    ruleTags: Array<RuleTag> | undefined
}

export interface Transaction {
    id: string
    bookingDate: Run['bookingDate']
    bankAccount: BankAccount['id']
    bankAccountName: BankAccount['name']
    amount: number
    transactionType: string
    counterpart: string | undefined
    references: Array<string> | undefined
    ruleApplied: Rule['id'] | undefined
    status: BookingStatus
}

export interface TransactionType {
    id: string
}

export interface MasterData {
    id: number
    accessToken: string
    refreshToken: string
    adminName: string
    adminEmail: string
    adminId: string
    erpSupplier: ErpSupplier
    ActiveERPIntegration: boolean
    AuthStatus: string | undefined
}

export interface Document {
    id: string
    type: DocumentType
    bookingDate: Run['bookingDate']
    content: Blob
    filename: string
    mimetype: string
}

export interface Run {
    bookingDate: Date
    status: RunStatus
    error: Array<string> | undefined
    transactions: Array<Transaction> | undefined
    docs: Array<Document> | undefined
}
