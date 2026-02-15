<script lang="ts" setup>
import BookingModal from '~/components/open-items/BookingModal.vue'
import useFlattenArray from '~/composables/useFlattenArray'
import type { OpenTransaction } from '~/types/transactions'
import { buildTransactionSummary, type TransactionSummary } from '~/utils/transactionSummary'

const { data, pending, refresh } = await useFetch<OpenTransaction[]>(
    '/api/transactions',
    { key: 'open-transactions', lazy: false }
)

const postings = computed<OpenTransaction[]>(() => useFlattenArray<OpenTransaction>(data))

const postingsByAccount = computed<Record<string, OpenTransaction[]>>(() => {
    const result: Record<string, OpenTransaction[]> = {}
    postings.value.forEach((tx) => {
        const accountName = tx.bankAccountName || 'Ukendt konto'
        if (!result[accountName]) {
            result[accountName] = []
        }
        result[accountName].push(tx)
    })
    return result
})

const summaryById = computed<Record<string, TransactionSummary>>(() => {
    const map: Record<string, TransactionSummary> = {}
    postings.value.forEach((tx) => {
        map[tx.id] = buildTransactionSummary(tx)
    })
    return map
})

const isBookingOpen = ref(false)
const selectedTransactionId = ref<string | null>(null)

const selectedTransaction = computed(() =>
    postings.value.find((tx) => tx.id === selectedTransactionId.value) ?? null
)

function openBookingModal(transaction: OpenTransaction) {
    selectedTransactionId.value = transaction.id
    isBookingOpen.value = true
}

async function handleBookingProcessed() {
    isBookingOpen.value = false
    selectedTransactionId.value = null
    await refresh()
}
</script>

<template>
    <UDashboardPanel id="open-items">
        <template #header>
            <UDashboardNavbar title="Åbne poster">
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <div v-if="pending" class="flex justify-center py-10">
                <USkeleton class="h-10 w-32" />
            </div>
            <div v-else-if="!postings.length" class="py-10 text-center text-gray-500">
                Der er ingen åbne transaktioner at behandle.
            </div>
            <template v-else>
                <UPageSection
                    v-for="(items, account) in postingsByAccount"
                    :key="account"
                    :title="account"
                    headline="Nordea"
                >
                    <UPageColumns>
                        <UPageCard
                            v-for="item in items"
                            :key="item.id"
                            :title="'Transaktion #' + item.id"
                            :description="item.counterpart || 'Ukendt modpart'"
                            :disabled="!summaryById[item.id]"
                            variant="soft"
                        >
                            <div v-if="summaryById[item.id]" class="space-y-4">
                                <div class="flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                        <p class="text-xs font-medium text-gray-500">{{ summaryById[item.id]?.amount.label }}</p>
                                        <p class="text-2xl font-semibold">{{ summaryById[item.id]?.amount.value }}</p>
                                    </div>
                                    <div class="text-right">
                                        <p class="text-xs font-medium text-gray-500">{{ summaryById[item.id]?.bookingDate.label }}</p>
                                        <p class="font-medium">{{ summaryById[item.id]?.bookingDate.value }}</p>
                                    </div>
                                </div>

                                <section
                                    v-for="section in summaryById[item.id]?.sections"
                                    :key="section.key"
                                    class="space-y-2"
                                >
                                    <p class="text-xs font-medium uppercase tracking-wide text-gray-500">
                                        {{ section.label }}
                                    </p>
                                    <UList v-if="'items' in section" :items="section.items">
                                        <template #item="{ item: sectionItem }">
                                            <div class="flex items-center justify-between gap-4 text-sm">
                                                <span class="text-gray-500">{{ sectionItem.label }}</span>
                                                <span class="font-medium text-right">{{ sectionItem.value }}</span>
                                            </div>
                                        </template>
                                    </UList>
                                    <div v-else class="flex flex-wrap gap-2">
                                        <UBadge
                                            v-for="(chip, chipIndex) in section.chips"
                                            :key="chip + chipIndex"
                                            color="neutral"
                                            variant="soft"
                                        >
                                            {{ chip }}
                                        </UBadge>
                                    </div>
                                </section>

                                <USeparator>
                                    <div class="flex w-full items-center justify-between gap-2">
                                        <span class="text-sm font-medium">Behandl</span>
                                        <UButton
                                            class="rounded-full"
                                            color="primary"
                                            size="lg"
                                            trailing-icon="solar:pen-new-round-bold-duotone"
                                            @click="openBookingModal(item)"
                                        />
                                    </div>
                                </USeparator>

                                <p class="text-xs text-gray-500">
                                    {{ summaryById[item.id]?.transactionId.label }}: {{ summaryById[item.id]?.transactionId.value }}
                                </p>
                            </div>
                        </UPageCard>
                    </UPageColumns>
                </UPageSection>
            </template>
        </template>
    </UDashboardPanel>
    <BookingModal
        v-model:open="isBookingOpen"
        :transaction="selectedTransaction"
        @processed="handleBookingProcessed"
    />
</template>