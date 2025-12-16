<script lang="ts" setup>
    import type { Transaction } from '~/types'
    import useFlattenArray from '~/composables/useFlattenArray'
    
    const { data, status } = await useFetch<Transaction[]>('/api/transactions', {
        lazy: true
    })

    const postings = computed<Transaction[]>(() => useFlattenArray<Transaction>(data));
    
    const postingsByAccount = computed<Record<string, Transaction[]>>(() => {
        const result: Record<string, Transaction[]> = {}

        postings.value.forEach(tx => {
            if (!result[tx.bankAccountName]) {
                result[tx.bankAccountName] = []
            }
            result[tx.bankAccountName].push(tx)
        })

        return result
    });
    
    type VisibleTransaction = Pick<
        Transaction,
        'id' | 'amount' | 'transactionType' | 'counterpart' | 'references'
    >

    const visibleDataById = computed<Record<number, VisibleTransaction>>(() => {
        const result: Record<number, VisibleTransaction> = {}

        postings.value.forEach(tx => {
            result[tx.id] = {
                Beløb: tx.amount,
                Transaktionstype: tx.transactionType,
                Modpart: tx.counterpart,
                Referencer: tx.references
            }
        })
        return result
    })

    const amountFormatter = new Intl.NumberFormat('da-DK', {
        style: 'currency',
        currency: 'DKK'
    })

    const formatValue = (key: string, value: unknown): string | string[] => {
        if (key === 'amount' && typeof value === 'number') {
            return amountFormatter.format(value)
        }

        if (Array.isArray(value)) {
            return value.map(v => String(v))
        }

        return String(value ?? '')
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
            <UPageSection
                v-for="(items, account) in postingsByAccount"
                :key="account"
                :title="account"
            >
                <UPageColumns>
                    <UPageCard
                        v-for="item in items"
                        :key="item.id"
                        :title="'Transaktion #' + item.id"
                        :description="new Date(item.bookingDate).toLocaleDateString('da-DK')"
                        :disabled="!visibleDataById[item.id]"
                        spotlight
                        spotlight-color="primary"
                    >
                        <div v-if="visibleDataById[item.id]" class="space-y-1 text-sm">
                            <div
                                v-for="([key, value]) in Object.entries(visibleDataById[item.id])"
                                :key="key"
                                class="flex justify-between gap-4"
                            >
                                <span class="font-medium text-gray-600 whitespace-nowrap">
                                    {{ key }}
                                </span>

                                <span class="text-right">
                                    <template v-if="Array.isArray(value)">
                                        <div
                                            v-for="(ref, index) in formatValue(key, value)"
                                            :key="index"
                                        >
                                            {{ ref }}
                                        </div>
                                    </template>

                                    <template v-else>
                                        {{ formatValue(key, value) }}
                                    </template>
                                </span>
                            </div>
                        </div>
                    </UPageCard>
                </UPageColumns>
            </UPageSection>
        </template>
    </UDashboardPanel>
</template>