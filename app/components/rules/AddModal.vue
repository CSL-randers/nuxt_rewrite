<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import type {
  AccountSelectSchema,
  TransactionTypeSelectSchema,
  Rule,
  RuleStatus,
  RuleType,
  CprType,
  RuleInsertSchema,
  MatchStepEntry
} from '~/lib/db/schema/index'
import { ruleTypeEnum, matchCategories } from '~/lib/db/schema/index'

const open = ref(false)
const currentStep = ref(0)
const toast = useToast()
const { handleSubmit } = useForm({})

const steps = [
  { id: 'basic', title: 'Basis', description: 'Vælg type, status og bankkonto' },
  { id: 'match', title: 'Matching', description: 'Vælg hvilke kendetegn reglen skal matche ud fra' },
  { id: 'accounting', title: 'Kontering', description: 'Angiv oplysninger relevant for bogføringen' }
]

// -------------------- MATCH STEP --------------------
const matches = ref<MatchStepEntry[]>([])

// Tilgængelige kolonner per kategori
const matchColumnsByCategory: Record<string, string[]> = {
  references: ['matchText','matchPrimaryReference','matchId','matchBatch','matchEndToEndId','matchOcrReference','matchDebtorsPaymentId','matchDebtorText','matchDebtorMessage','matchCreditorText','matchCreditorMessage'],
  counterparties: ['matchDebtorId','matchDebtorName','matchCreditorId','matchCreditorName'],
  classification: ['matchType','matchTxDomain','matchTxFamily','matchTxSubFamily']
}

// Midlertidige inputs for hver kategori
const matchInputs = reactive<Record<string,string>>(
  Object.fromEntries(matchCategories.map(c => [c, '']))
)

// Valgte kolonner per kategori
const selectedColumns = reactive<Record<string,string[]>>(
  Object.fromEntries(matchCategories.map(c => [c, []]))
)

// Valgt gate per kategori
const selectedGates = reactive<Record<string,'AND'|'OR'>>(
  Object.fromEntries(matchCategories.map(c => [c, 'AND']))
)

const addMatchEntry = (category: typeof matchCategories[number]) => {
  const value = matchInputs[category]
  const fields = selectedColumns[category]
  const gate = selectedGates[category]
  if (!value.trim() || fields.length === 0) return
  matches.value.push({ category, value, fields, gate })
  matchInputs[category] = ''
}

const removeMatchEntry = (index: number) => {
  matches.value.splice(index, 1)
}

// -------------------- ACCOUNTING & BASIC --------------------
type AttachmentPayload = {
  names: string[]
  extensions: string[]
  base64: string[]
}
const attachments = ref<AttachmentPayload | null>(null)
const handleAttachmentUpdate = (value: AttachmentPayload | null) => {
  attachments.value = value
}

type AccountOption = { label: string, value: string }
const { data: rawAccounts } = await useFetch<AccountSelectSchema[]>('/api/bank-accounts', { key: 'bankaccounts' })
const accountOptions = computed<AccountOption[]>(() =>
  (rawAccounts.value ?? []).map(acc => ({ label: acc.name, value: acc.id }))
)

type TransactionTypeOption = { label: string, value: string }
const { data: rawTransactionTypes } = await useFetch<TransactionTypeSelectSchema[]>('/api/transaction-types', { key: 'transactiontypes' })
const transactionTypeOptions = computed<TransactionTypeOption[]>(() =>
  (rawTransactionTypes.value ?? []).map(tt => ({ label: tt.id, value: tt.id }))
)

// Form state
const state = reactive<Partial<RuleInsertSchema>>({
  type: 'standard',
  status: 'aktiv',
  relatedBankAccounts: [] as string[],
  matchText: [],
  matchCounterparty: [],
  matchType: [],
  matchAmountMin: undefined,
  matchAmountMax: undefined,
  accountingPrimaryAccount: undefined,
  accountingSecondaryAccount: undefined,
  accountingTertiaryAccount: undefined,
  accountingText: undefined,
  accountingCprType: 'ingen',
  accountingCprNumber: undefined,
  accountingNotifyTo: undefined,
  accountingNote: undefined,
  ruleTags: undefined,
  accountingAttachmentName: undefined,
  accountingAttachmentFileExtension: undefined,
  accountingAttachmentData: undefined
})

watch(
  () => state,
  (newVal) => console.log('State changed:', newVal),
  { deep: true }
)

const typeOptions = [
  { label: 'Standard', value: 'standard' },
  { label: 'Undtagelse', value: 'undtagelse' },
  { label: 'Engangs', value: 'engangs' }
] satisfies { label: string; value: RuleType }[]

const statusOptions = [
  { label: 'Aktiv', value: 'aktiv' },
  { label: 'Inaktiv', value: 'inaktiv' }
] satisfies { label: string; value: RuleStatus }[]

const cprTypeOptions = [
  { label: 'Ingen', value: 'ingen' },
  { label: 'Statisk', value: 'statisk' },
  { label: 'Dynamisk', value: 'dynamisk' }
] satisfies { label: string; value: CprType }[]

const canProceed = computed(() => {
  if (currentStep.value === 0) {
    return state.type && state.status && state.relatedBankAccounts?.length > 0
  }
  return true
})

const onSubmit = async (event: FormSubmitEvent<Rule>) => {
  state.accountingAttachmentName = attachments.value?.names
  state.accountingAttachmentFileExtension = attachments.value?.extensions
  state.accountingAttachmentData = attachments.value?.base64

  // Her kan du mappe matches til DB columns, fx via mapMatchesToDbArrays(matches.value)
  console.log('Form submitted:', state, matches.value)

  toast.add({ title: 'Regel oprettet', description: 'Den nye regel er blevet oprettet.' })
  open.value = false
  currentStep.value = 0
}

const handleNext = () => { if (currentStep.value < steps.length - 1) currentStep.value++ }
const handlePrev = () => { if (currentStep.value > 0) currentStep.value-- }
</script>

<template>
  <UModal v-model:open="open" title="Ny regel">
    <UButton class="font-bold rounded-full" icon="i-lucide-plus" label="Ny regel" />

    <template #body>
      <UForm @submit.prevent="onSubmit">
        <UStepper v-model="currentStep" :items="steps" class="mb-6">
          <template #content="{ item }">
            <USeparator class="mb-6"/>
            
            <!-- BASIC STEP -->
            <template v-if="item.id === 'basic'">
              <div class="flex justify-between gap-4">
                <UFormField label="Regeltype" name="type" required>
                  <USelect v-model="state.type" :items="typeOptions" labelKey="label" value-attribute="value" placeholder="Vælg regeltype" />
                </UFormField>

                <UFormField label="Status" name="status" required>
                  <USelect v-model="state.status" :items="statusOptions" labelKey="label" value-attribute="value" placeholder="Vælg status" />
                </UFormField>

                <UFormField label="Bankkonto" name="relatedBankAccounts" required>
                  <USelectMenu :ui="{ content: 'min-w-fit' }" v-model="state.relatedBankAccounts" :items="accountOptions" multiple labelKey="label" valueKey="value" placeholder="Vælg bankkonto"/>
                </UFormField>
              </div>
            </template>

            <!-- MATCH STEP -->
            <template v-if="item.id === 'match'">
              <div class="space-y-6">
                <div v-for="category in matchCategories" :key="category" class="mb-6">
                  <h3 class="font-semibold mb-2">{{ category }}</h3>

                  <div class="flex gap-2 mb-2">
                    <UInput v-model="matchInputs[category]" :placeholder="`Tilføj ${category}`" />
                    <UButton icon="i-lucide-plus" color="primary" variant="subtle" @click="() => addMatchEntry(category)" />
                  </div>

                  <!-- Kolonnevalg -->
                  <div class="flex flex-wrap gap-2 mb-2">
                    <label v-for="col in matchColumnsByCategory[category]" :key="col" class="inline-flex items-center gap-1 cursor-pointer">
                      <input type="checkbox" v-model="selectedColumns[category]" :value="col" />
                      {{ col }}
                    </label>
                  </div>

                  <!-- Gate -->
                  <div class="flex gap-4 mb-2">
                    <label class="inline-flex items-center gap-1">
                      <input type="radio" v-model="selectedGates[category]" value="AND" /> AND
                    </label>
                    <label class="inline-flex items-center gap-1">
                      <input type="radio" v-model="selectedGates[category]" value="OR" /> OR
                    </label>
                  </div>

                  <!-- Liste af entries -->
                  <div class="flex flex-wrap gap-2 mt-2">
                    <UBadge v-for="(entry, idx) in matches.filter(m => m.category === category)" :key="idx" variant="subtle" color="primary" class="cursor-pointer" @click="removeMatchEntry(idx)">
                      {{ entry.value }} ({{ entry.gate }})
                      <UIcon name="i-lucide-x" class="ml-1" />
                    </UBadge>
                  </div>
                </div>
              </div>
            </template>

            <!-- ACCOUNTING STEP -->
            <template v-if="item.id === 'accounting'">
              <!-- behold din eksisterende accounting template -->
            </template>
          </template>
        </UStepper>

        <div class="flex justify-between gap-2 pt-4 border-t border-default">
          <UButton label="Forrige" variant="soft" color="neutral" @click="handlePrev" :disabled="currentStep === 0"/>
          <template v-if="currentStep === steps.length - 1">
            <UButton type="submit">Opret regel</UButton>
          </template>
          <template v-else>
            <UButton label="Næste" color="primary" variant="solid" @click="handleNext" :disabled="!canProceed"/>
          </template>
        </div>
      </UForm>
    </template>
  </UModal>
</template>
