<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import type {
  AccountSelectSchema,
  RuleDraftSchema,
  RuleStatus,
  RuleType,
  CprType,
  MatchField,
  MatchEntry,
  MatchGate,
  MatchCategory
} from '~/lib/db/schema/index'
import {
  ruleTypeEnum,
  ruleStatusEnum,
  cprTypeEnum,
  matchCategories,
  matchCategoryColumns,
  mapMatchesToDbArrays
} from '~/lib/db/schema/index'

const open = ref(false)
const currentStep = ref(0)
const toast = useToast()

const steps = [
  { id: 'basic', title: 'Basis', description: 'Vælg type, status og bankkonto' },
  { id: 'match', title: 'Matching', description: 'Vælg hvilke kendetegn reglen skal matche ud fra' },
  { id: 'accounting', title: 'Kontering', description: 'Angiv oplysninger relevant for bogføringen' }
]

// ---------------------
// Match object handlers
// ---------------------
const matches = ref<MatchEntry[]>([])

function initCategoryRecord<T>(
  initial: () => T
): Record<MatchCategory, T> {
  const record = {} as Record<MatchCategory, T>
  for (const category of matchCategories) {
    record[category] = initial()
  }
  return record
}

const selectedColumns = reactive(
  initCategoryRecord<MatchField[]>(() => [])
)

const matchInputs = reactive(
  initCategoryRecord<string>(() => '')
)

const selectedGates = reactive(
  initCategoryRecord<MatchGate>(() => 'OG')
)

const addMatchEntry = (category: MatchCategory) => {
  const value = matchInputs[category].trim()
  if (!value) return

  const fields = selectedColumns[category]
  const gate = selectedGates[category]

  const entry: MatchEntry = {
    category,
    value,
    gate,
    ...(fields.length > 0 ? { fields } : {})
  }

  matches.value.push(entry)

  matchInputs[category] = ''
  selectedColumns[category] = []
  selectedGates[category] = 'OG'
}

const removeMatchEntry = (index: number) => {
  matches.value.splice(index, 1)
}

// ------------------
// Attachment helpers
// ------------------
type AttachmentPayload = {
  names: string[]
  extensions: string[]
  base64: string[]
}
const attachments = ref<AttachmentPayload | null>(null)
const handleAttachmentUpdate = (value: AttachmentPayload | null) => {
  attachments.value = value
}

// --------------
// State creation
// --------------
type RuleDraftUiState = Omit<RuleDraftSchema, 'matches'> & {
  matches?: MatchEntry[]
}

const state = reactive<Partial<RuleDraftUiState>>({
  type: 'standard' as RuleType,
  status: 'aktiv' as RuleStatus,
  relatedBankAccounts: [],
  accountingPrimaryAccount: undefined,
  accountingSecondaryAccount: undefined,
  accountingTertiaryAccount: undefined,
  accountingText: undefined,
  accountingCprType: 'ingen' as CprType,
  accountingCprNumber: undefined,
  accountingNotifyTo: undefined,
  accountingNote: undefined,
  accountingAttachmentName: null,
  accountingAttachmentFileExtension: null,
  accountingAttachmentData: null,
  ruleTags: null
})

// ------------------------------------------
// Options to USelect og USelectMenu elements
// ------------------------------------------
type AccountOption = { label: string, value: string }
const { data: rawAccounts } = await useFetch<AccountSelectSchema[]>('/api/bank-accounts', { key: 'bankaccounts' })
const accountOptions = computed<AccountOption[]>(() =>
  (rawAccounts.value ?? []).map(acc => ({
    label: acc.id,
    value: acc.id
  }))
)

const typeOptions = Object.values(ruleTypeEnum).map(value => ({
  label: value.charAt(0).toUpperCase() + value.slice(1), // gør første bogstav stort
  value
})) satisfies { label: string; value: RuleType }[]

const statusOptions = Object.values(ruleStatusEnum).map(value => ({
  label: value.charAt(0).toUpperCase() + value.slice(1),
  value
})) satisfies { label: string; value: RuleStatus }[]

const cprTypeOptions = Object.values(cprTypeEnum).map(value => ({
  label: value.charAt(0).toUpperCase() + value.slice(1),
  value
})) satisfies { label: string; value: CprType }[]

// ---------------
// Step validation
// ---------------
const canProceed = computed(() => {
  if (currentStep.value === 0) {
    return state.type && state.status && state.relatedBankAccounts && state.relatedBankAccounts?.length > 0
  }
  return true
})

const handleNext = () => { if (currentStep.value < steps.length - 1) currentStep.value++ }
const handlePrev = () => { if (currentStep.value > 0) currentStep.value-- }

const onSubmit = async (event: FormSubmitEvent<RuleDraftSchema>) => {
  state.accountingAttachmentName = attachments.value?.names
  state.accountingAttachmentFileExtension = attachments.value?.extensions
  state.accountingAttachmentData = attachments.value?.base64

  const dbMatches = mapMatchesToDbArrays(matches.value)

  const payload = {
    ...state,
    ...dbMatches
  }

  await useFetch<RuleDraftSchema[]>('/api/rule', { body: payload, method: 'POST' })

  console.log('Form submitted:', payload)

  toast.add({ title: 'Regel oprettet', description: 'Den nye regel er blevet oprettet.' })
  open.value = false
  currentStep.value = 0
}
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
                  <USelect v-model="state.type as RuleType" :items="typeOptions" labelKey="label" valueKey="value" placeholder="Vælg regeltype" />
                </UFormField>

                <UFormField label="Status" name="status" required>
                  <USelect v-model="state.status as RuleStatus" :items="statusOptions" labelKey="label" valueKey="value" placeholder="Vælg status" />
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
                    <label v-for="col in matchCategoryColumns[category]" :key="col" class="inline-flex items-center gap-1 cursor-pointer">
                      <input type="checkbox" v-model="selectedColumns[category]" :value="col" />
                      {{ col }}
                    </label>
                  </div>

                  <!-- Gate -->
                  <div class="flex gap-4 mb-2">
                    <label class="inline-flex items-center gap-1">
                      <input type="radio" v-model="selectedGates[category]" value="OG" /> OG
                    </label>
                    <label class="inline-flex items-center gap-1">
                      <input type="radio" v-model="selectedGates[category]" value="ELLER" /> ELLER
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
							<div class="space-y-4">
								<div class="flex justify-center flex-wrap gap-4 mb-6">
									<UFormField label="Primær konto" name="accountingPrimaryAccount" required>
										<UInput
											v-model="state.accountingPrimaryAccount"
											placeholder="Artskonto i Opus"
										/>
									</UFormField>
									<UFormField label="Sekundær konto" name="accountingSecondaryAccount">
										<UInput
											v-model="state.accountingSecondaryAccount"
											placeholder="PSP-element i Opus"
										/>
									</UFormField>
									<UFormField label="Tertiær konto" name="accountingTertiaryAccount">
										<UInput
											v-model="state.accountingTertiaryAccount"
											placeholder="Omkostningssted i Opus"
										/>
									</UFormField>
								</div>

								<div class="flex justify-center gap-4 mb-6">
									<UFormField label="Posteringstekst" name="accountingText">
										<UInput
											v-model="state.accountingText"
											placeholder="Valgfri"
										/>
									</UFormField>
								</div>

								<div class="flex justify-center gap-4 mb-6">
									<UFormField label="CPR-type" name="accountingCprType">
										<USelectMenu
											:ui="{ content: 'min-w-fit' }"
											v-model="state.accountingCprType as CprType"
											:items="cprTypeOptions"
											labelKey="label"
											valueKey="value"
											placeholder="Vælg CPR-type"
										/>
									</UFormField>
									<UFormField label="CPR-nummer" name="accountingCprNumber">
										<UInput
											v-model="state.accountingCprNumber"
											:disabled="state.accountingCprType !== 'statisk'"
										/>
									</UFormField>
								</div>

								<div class="flex justify-center gap-4" mb-6>
									<UFormField label="Notifikation til" name="accountingNotifyTo">
										<UInput
											v-model="state.accountingNotifyTo"
											type="email"
											placeholder="f.eks. csl@randers.dk"
										/>
									</UFormField>
								</div>

								<div class="flex justify-center gap-4">
									<UFormField label="Noter" name="accountingNote">
										<UTextarea
											v-model="state.accountingNote"
											placeholder="Valgfri notering"
										/>
									</UFormField>
								</div>

								<div class="flex justify-center gap-4">
									<RulesFileUpload @update="handleAttachmentUpdate" />
								</div>
							</div>
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
