<script setup lang="ts">
		import type { FormSubmitEvent } from '@nuxt/ui'
		import type { BankAccount, TransactionType, Rule, RuleStatus, RuleType, CprType } from '~/types'
		import type { RuleFormSchema } from '~/schemas/rules.schema'

		const open = ref(false)
		const currentStep = ref(0)
		const toast = useToast()
    const { handleSubmit } = useForm({
      
    })

		const steps = [
			{ id: 'basic', title: 'Basis', description: 'Vælg type, status og bankkonto' },
			{ id: 'match', title: 'Matching', description: 'Vælg hvilke kendetegn reglen skal matche ud fra' },
			{ id: 'accounting', title: 'Kontering', description: 'Angiv oplysninger relevant for bogføringen' }
		]

		type AttachmentPayload = {
			names: string[]
			extensions: string[]
			base64: string[]
		}

		const attachments = ref<AttachmentPayload | null>(null)

		const handleAttachmentUpdate = (value: AttachmentPayload | null) => {
			attachments.value = value
		}

		type BankAccountOption = { label: string, value: string }

		const { data: rawAccounts } = await useFetch<BankAccount[]>('/api/bank-accounts', {
			key: 'bankaccounts'
		})

		const bankAccountOptions = computed<BankAccountOption[]>(() =>
			(rawAccounts.value ?? []).map(acc => ({
				label: acc.name,
				value: acc.id
			}))
		)

		type TransactionTypeOption = { label: string, value: string }

		const { data: rawTransactionTypes } = await useFetch<TransactionType[]>('/api/transaction-types', {
			key: 'transactiontypes'
		})

		const transactionTypeOptions = computed<TransactionTypeOption[]>(() =>
			(rawTransactionTypes.value ?? []).map(tt => ({
				label: tt.id,
				value: tt.id
			}))
		)

		// Form state
		const state = reactive<Partial<RuleFormSchema>>({
			createdAt: new Date(),
			updatedAt: new Date(),
			type: 'standard',
			status: 'aktiv',
			relatedBankAccounts: [] as string[],
			matchText: undefined,
			matchCounterparty: undefined,
			matchType: [] as string[],
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
			accountingAttachmentMimetype: undefined,
			accountingAttachmentData: undefined
		})

		// Watch hele state for debugging
		watch(
			() => state,
			(newVal, oldVal) => {
				console.log('State changed:', newVal)
			},
			{ deep: true } // deep: true er vigtigt for reactive objekter
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

		const matchTextInput = ref('')
		const matchCounterpartyInput = ref('')

		const addMatchText = () => {
			if (matchTextInput.value.trim()) {
				if (!state.matchText) state.matchText = []
				state.matchText.push(matchTextInput.value)
				matchTextInput.value = ''
			}
		}

		const removeMatchText = (index: number) => {
			if (state.matchText) {
				state.matchText.splice(index, 1)
			}
		}

		const addMatchCounterparty = () => {
			if (matchCounterpartyInput.value.trim()) {
				if (!state.matchCounterparty) state.matchCounterparty = []
				state.matchCounterparty.push(matchCounterpartyInput.value)
				matchCounterpartyInput.value = ''
			}
		}

		const removeMatchCounterparty = (index: number) => {
				if (state.matchCounterparty) {
						state.matchCounterparty.splice(index, 1)
				}
		}

		const canProceed = computed(() => {
			if (currentStep.value === 0) {
				return state.type && (state.status && state.relatedBankAccounts && state.relatedBankAccounts.length > 0)
			}
			return true
		})

		const onSubmit = async (event: FormSubmitEvent<Rule>) => {
			state.accountingAttachmentName = attachments.value?.names,
			state.accountingAttachmentMimetype = attachments.value?.extensions,
			state.accountingAttachmentData = attachments.value?.base64

			try {
				// Send form data to API
				console.log('Form submitted:', state)
				toast.add({
					title: 'Regel oprettet',
					description: 'Den nye regel er blevet oprettet.'
				})
				open.value = false
				currentStep.value = 0
			} catch (error) {
				toast.add({
					title: 'Fejl',
					description: 'Der skete en fejl ved oprettelsen af reglen.',
					color: 'error'
				})
			}
		}

		const handleNext = () => {
				if (currentStep.value < steps.length - 1) {
						currentStep.value++
				}
		}

		const handlePrev = () => {
				if (currentStep.value > 0) {
						currentStep.value--
				}
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
						<template v-if="item.id === 'basic'">
							<div class="flex justify-between gap-4">
								<UFormField label="Regeltype" name="type" required>
									<USelect
										v-model="state.type"
										:items="typeOptions"
										labelKey="label"
										value-attribute="value"
										placeholder="Vælg regeltype"
									/>
								</UFormField>

								<UFormField label="Status" name="status" required>
									<USelect
										v-model="state.status"
										:items="statusOptions"
										labelKey="label"
										value-attribute="value"
										placeholder="Vælg status"
									/>
								</UFormField>

								<UFormField label="Bankkonto" name="relatedBankAccounts" required>
									<USelectMenu
										:ui="{ content: 'min-w-fit' }"
										v-model="state.relatedBankAccounts"
										:items="bankAccountOptions"
										multiple
										labelKey="label"
										valueKey="value"
										placeholder="Vælg bankkonto"
									/>
								</UFormField>
							</div>
						</template>

						<template v-if="item.id === 'match'">
							<div class="space-y-4">
								<div class="flex justify-between gap-4 mb-6">
									<div>
										<label class="block text-sm font-medium mb-2">Fritekst</label>
										<div class="flex gap-2 mb-2">
											<UInput v-model="matchTextInput" placeholder="Tilføj søgeord" />
											<UButton
												@click="addMatchText"
												icon="i-lucide-plus"
												color="primary"
												variant="subtle"
											/>
										</div>
										<div class="flex flex-wrap gap-2">
											<UBadge
												v-for="(text, idx) in state.matchText"
												:key="idx"
												variant="subtle"
												color="primary"
												class="cursor-pointer"
												@click="removeMatchText(idx)"
											>
												{{ text }}
												<UIcon name="i-lucide-x" class="ml-1" />
											</UBadge>
										</div>
									</div>

									<div>
										<label class="block text-sm font-medium mb-2">Modpart</label>
										<div class="flex gap-2 mb-2">
											<UInput v-model="matchCounterpartyInput" placeholder="Tilføj modpart" />
											<UButton
												@click="addMatchCounterparty"
												icon="i-lucide-plus"
												color="primary"
												variant="subtle"
											/>
										</div>
										<div class="flex flex-wrap gap-2">
											<UBadge
												v-for="(cp, idx) in state.matchCounterparty"
												:key="idx"
												variant="subtle"
												color="primary"
												class="cursor-pointer"
												@click="removeMatchCounterparty(idx)"
											>
												{{ cp }}
												<UIcon name="i-lucide-x" class="ml-1" />
											</UBadge>
										</div>
									</div>
								</div>
								
								<div class="flex justify-between gap-4 mb-6">
									<UFormField label="Beløb fra" name="matchAmountMin">
										<UInputNumber
											v-model="state.matchAmountMin"
													:format-options="{
														style: 'currency',
														currency: 'DKK',
														currencyDisplay: 'code',
														currencySign: 'accounting'
													}"
										/>
									</UFormField>
									<UFormField label="Beløb til" name="matchAmountMax">
										<UInputNumber 
											v-model="state.matchAmountMax"
											:format-options="{
												style: 'currency',
												currency: 'DKK',
												currencyDisplay: 'code',
												currencySign: 'accounting'
											}"
										/>
									</UFormField>
								</div>

								<div class="flex justify-center gap-4">
									<UFormField label="Transaktionstype" name="matchType">
										<USelectMenu
											:ui="{ content: 'min-w-fit' }"
											v-model="state.matchType"
											:items="transactionTypeOptions"
											multiple
											labelKey="label"
											valueKey="value"
											placeholder="Vælg transaktionstype"
										/>
									</UFormField>
								</div>
							</div>
						</template>

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
											v-model="state.accountingCprType"
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

				<!-- Action buttons -->
				<div class="flex justify-between gap-2 pt-4 border-t border-default">
					<UButton
						label="Forrige"
						variant="soft"
						color="neutral"
						@click="handlePrev"
						:disabled="currentStep === 0"
					/>

					<template v-if="currentStep === steps.length - 1">
						<UButton type="submit">
							Opret regel
						</UButton>
					</template>

					<template v-else>
						<UButton
							label="Næste"
							color="primary"
							variant="solid"
							@click="handleNext"
							:disabled="!canProceed"
						/>
					</template>
				</div>
			</UForm>
		</template>
	</UModal>
</template>