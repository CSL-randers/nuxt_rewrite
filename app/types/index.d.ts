export type RuleStatus = 'aktiv' | 'inaktiv'
export type RuleType = 'standard' | 'undtagelse' | 'engangs'
export type CprType = 'dynamisk' | 'statisk' | 'ingen'

export type RunStatus = 'afventer' | 'indlæser' | 'udført' | 'fejl'
export type DocumentType = 'afstemning' | 'postering'
export type ErpSupplier = 'KMD' | 'andet'

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
    bankAccountName: BankAccount['name']
    lastUsed: Run['bookingDate'] | null
    createdAt: Date
    updatedAt: Date | null
    matchText: Array<string> | null
    matchCounterparty: Array<string> | null
    matchType: string
    matchAmountMin: number | null
    matchAmountMax: number | null
    accountingPrimaryAccount: string | null // Artskonto i Opus
    accountingSecondaryAccount: string | null // PSP-element i Opus
    accountingTertiaryAccount: string | null // Omkostningssted i Opus
    accountingText: string | null
    accountingCprType: CprType
    accountingCprNumber: string | null
    accountingNotifyTo: string | null
    accountingNote: string | null
    accountingAttachmentName: string | null
    accountingAttachmentMimetype: string | null
    accountingAttachmentData: string | null // Base64 encoded
    ruleTags: Array<RuleTag> | null
}

export interface Transaction {
    id: string
    bookingDate: Run['bookingDate']
    bankAccount: BankAccount['id']
    data: JSON
    ruleApplied: Rule | null
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
    AuthStatus: string | null
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
    error: Array<string> | null
    transactions: Array<Transaction> | null
    docs: Array<Document> | null
}
