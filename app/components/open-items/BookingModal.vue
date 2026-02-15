<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'
import RulesFileUpload from '~/components/rules/FileUpload.vue'
import type { OpenTransaction, ManualPostingAttachment } from '~/types/transactions'
import { cprTypeValues, type CprType } from '~/lib/db/schema'
import { buildTransactionSummary, type TransactionSummary } from '~/utils/transactionSummary'

type AttachmentPayload = {
	names: string[]
	extensions: string[]
	base64: string[]
}

const props = defineProps<{
	open: boolean
	transaction: OpenTransaction | null
}>()
const transaction = toRef(props, 'transaction')

const emit = defineEmits<{
	(e: 'update:open', value: boolean): void
	(e: 'processed'): void
}>()

const open = computed({
	get: () => props.open,
	set: (value: boolean) => emit('update:open', value)
})

const toast = useToast()
const formRef = ref()

const manualBookingFormSchema = z
	.object({
		primaryAccount: z.string().min(1, 'Primær konto er påkrævet'),
		secondaryAccount: z.string().optional(),
		tertiaryAccount: z.string().optional(),
		text: z.string().optional(),
		cprType: z.enum(cprTypeValues),
		cprNumber: z.string().optional(),
		notifyTo: z.string().email('Ugyldig email').optional(),
		note: z.string().optional()
	})
	.superRefine((data, ctx) => {
		if (data.cprType === 'statisk' && !data.cprNumber?.trim()) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'CPR-nummer er påkrævet, når CPR-type er statisk',
				path: ['cprNumber']
			})
		}
	})

type ManualFormState = z.infer<typeof manualBookingFormSchema>

const defaultState = (): ManualFormState => ({
	primaryAccount: '',
	secondaryAccount: '',
	tertiaryAccount: '',
	text: 'Tekst fra bank',
	cprType: 'ingen' as CprType,
	cprNumber: '',
	notifyTo: '',
	note: ''
})

const formState = reactive<ManualFormState>(defaultState())
const isSubmitting = ref(false)

const attachments = ref<AttachmentPayload | null>(null)
const attachmentList = computed<ManualPostingAttachment[]>(() => {
	if (!attachments.value) return []
	const result: ManualPostingAttachment[] = []
	const { names, extensions, base64 } = attachments.value
	for (let i = 0; i < base64.length; i++) {
		if (names[i] && extensions[i] && base64[i]) {
			result.push({ name: names[i], type: extensions[i], data: base64[i] })
		}
	}
	return result
})

watch(
	() => transaction.value?.id,
	() => {
		Object.assign(formState, defaultState())
		attachments.value = null
	},
	{ immediate: true }
)

watch(
	() => props.open,
	(value) => {
		if (!value) {
			Object.assign(formState, defaultState())
			attachments.value = null
		}
	}
)

const cprTypeOptions = computed(() =>
	cprTypeValues.map((value) => ({
		label: value.charAt(0).toUpperCase() + value.slice(1),
		value
	}))
)

const summary = computed<TransactionSummary | null>(() => {
	if (!transaction.value) return null
	return buildTransactionSummary(transaction.value)
})

const headerAmount = computed(() => summary.value?.amount.value ?? '')
const headerBookingDate = computed(() => summary.value?.bookingDate.value ?? '')
const summarySections = computed(() => summary.value?.sections ?? [])
const transactionIdLabel = computed(() => summary.value?.transactionId.label ?? '')
const transactionIdValue = computed(() => summary.value?.transactionId.value ?? '')

const sanitize = (value?: string): string | undefined => {
	if (value == null) return undefined
	const trimmed = value.trim()
	return trimmed.length ? trimmed : undefined
}

const handleAttachmentUpdate = (value: AttachmentPayload | null) => {
	attachments.value = value
}

async function handleSubmit(event: FormSubmitEvent<typeof manualBookingFormSchema>) {
	if (!transaction.value) return

	const payload = {
		primaryAccount: sanitize(event.data.primaryAccount) ?? '',
		secondaryAccount: sanitize(event.data.secondaryAccount),
		tertiaryAccount: sanitize(event.data.tertiaryAccount),
		text: sanitize(event.data.text),
		cprType: event.data.cprType,
		cprNumber: sanitize(event.data.cprNumber),
		notifyTo: sanitize(event.data.notifyTo),
		note: sanitize(event.data.note),
		attachments: attachmentList.value.length ? attachmentList.value : undefined
	}

	try {
		isSubmitting.value = true
		await $fetch(`/api/transactions/${transaction.value.id}/process`, {
			method: 'POST',
			body: payload
		})
		toast.add({
			title: 'Postering sendt',
			description: `Transaktion ${transaction.value.id} er sendt til ERP.`,
			color: 'primary'
		})
		emit('processed')
	} catch (error: any) {
		const description = error?.data?.message ?? error?.message ?? 'Uventet fejl'
		toast.add({
			title: 'Kunne ikke bogføre',
			description,
			color: 'error'
		})
	} finally {
		isSubmitting.value = false
	}
}
</script>

<template>
	<UModal v-model:open="open" :title="transaction ? 'Konter transaktion' : 'Vælg transaktion'">
		<template #body>
			<div v-if="!transaction" class="py-8 text-center text-sm text-gray-500">
				Vælg en transaktion for at starte behandlingen.
			</div>
			<div v-else class="space-y-4">
					<UCard v-if="summary" variant="soft">
						<template #header>
							<div class="flex flex-wrap items-start justify-between gap-6">
								<div>
									<p class="text-xs font-medium text-gray-500">Beløb</p>
									<p class="text-2xl font-semibold">{{ headerAmount }}</p>
								</div>
								<div class="text-right">
									<p class="text-xs font-medium text-gray-500">{{ summary.bookingDate.label }}</p>
									<p class="text-base font-medium">{{ headerBookingDate }}</p>
								</div>
							</div>
						</template>
						<div class="space-y-4">
							<section v-for="section in summarySections" :key="section.key" class="space-y-2">
								<p class="text-xs font-medium uppercase tracking-wide text-gray-500">
									{{ section.label }}
								</p>
								<UList v-if="'items' in section" :items="section.items">
									<template #item="{ item }">
										<div class="flex items-center justify-between gap-4 text-sm">
											<span class="text-gray-500">{{ item.label }}</span>
											<span class="font-medium text-right">{{ item.value }}</span>
										</div>
									</template>
								</UList>
								<div v-else class="flex flex-wrap gap-2">
									<UBadge
										v-for="(chip, idx) in section.chips"
										:key="chip + idx"
										variant="soft"
										color="neutral"
									>
										{{ chip }}
									</UBadge>
								</div>
							</section>
							<p class="text-xs text-gray-500">
								{{ transactionIdLabel }}: {{ transactionIdValue }}
							</p>
						</div>
					</UCard>

					<UForm
						ref="formRef"
						:schema="manualBookingFormSchema"
						:state="formState"
						:disabled="isSubmitting"
						class="space-y-4"
						@submit="handleSubmit"
					>
						<div class="grid gap-4 md:grid-cols-2">
							<UFormField label="Primær konto" name="primaryAccount" required>
								<UInput v-model="formState.primaryAccount" placeholder="Artskonto" />
							</UFormField>
							<UFormField label="Sekundær konto" name="secondaryAccount">
								<UInput v-model="formState.secondaryAccount" placeholder="PSP-element" />
							</UFormField>
							<UFormField label="Tertiær konto" name="tertiaryAccount">
								<UInput v-model="formState.tertiaryAccount" placeholder="Omkostningssted" />
							</UFormField>
							<UFormField label="Posteringstekst" name="text">
								<UInput v-model="formState.text" placeholder="Tekst fra bank" />
							</UFormField>
						</div>

						<div class="grid gap-4 md:grid-cols-2">
							<UFormField label="CPR-type" name="cprType">
								<USelectMenu
									v-model="formState.cprType"
									:items="cprTypeOptions"
									valueKey="value"
									labelKey="label"
									placeholder="Vælg type"
								/>
							</UFormField>
							<UFormField label="CPR-nummer" name="cprNumber">
								<UInput v-model="formState.cprNumber" :disabled="formState.cprType !== 'statisk'" />
							</UFormField>
						</div>

						<UFormField label="Notifikation sendes til" name="notifyTo">
							<UInput v-model="formState.notifyTo" type="email" placeholder="f.eks. bogholderi@kommune.dk" />
						</UFormField>

						<UFormField label="Noter" name="note">
							<UTextarea v-model="formState.note" placeholder="Valgfri note" />
						</UFormField>

						<RulesFileUpload @update="handleAttachmentUpdate" />

						<div class="flex items-center justify-end gap-3 pt-4">
							<UButton
								variant="soft"
								color="neutral"
								@click="open = false"
								:disabled="isSubmitting"
							>
								Luk
							</UButton>
							<UButton
								type="submit"
								color="primary"
								icon="i-lucide-send"
								:loading="isSubmitting"
							>
								Send til ERP
							</UButton>
						</div>
					</UForm>
				</div>
		</template>
	</UModal>
</template>
