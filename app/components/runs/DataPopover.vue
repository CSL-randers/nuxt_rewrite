<script setup lang="ts">
    import type { Run } from '~/types'

    interface Props {
        type: 'error' | 'transactions' | 'docs'
        run: Run
        open: boolean
    }

    interface Emits {
        (e: 'update:open', value: boolean): void
    }

    const props = defineProps<Props>()
    const emit = defineEmits<Emits>()

    const docUrlMap = new Map<string, string>()

    const getDocUrl = (doc: any): string | null => {
        if (!doc.content) return null
        
        let url = docUrlMap.get(doc.id)
        if (!url) {
            try {
                const blob = doc.content instanceof Blob ? doc.content : new Blob([doc.content])
                url = URL.createObjectURL(blob)
                docUrlMap.set(doc.id, url)
            } catch (e) {
                console.error('Failed to create object URL for document:', doc.id, e)
                return null
            }
        }
        return url
    }

    const groupDocsByType = (docs: any[]) => {
        return docs.reduce((acc: Record<string, any[]>, d: any) => {
            acc[d.type] = acc[d.type] ?? []
            acc[d.type].push(d)
            return acc
        }, {})
    }

    const groupTransactionsByAccount = (txs: any[]) => {
        return txs.reduce((acc: Record<string, any[]>, tx: any) => {
            const account = tx.bankAccountName || 'Ukendt konto'
            if (!acc[account]) {
                acc[account] = []
            }
            acc[account].push(tx)
            return acc
        }, {})
    }

    const getTitle = () => {
        switch (props.type) {
            case 'error':
                return `Fejl (${props.run.error?.length || 0})`
            case 'transactions':
                return `Transaktioner (${props.run.transactions?.length || 0})`
            case 'docs':
                return `Dokumenter (${props.run.docs?.length || 0})`
        }
    }

    const getIcon = () => {
        switch (props.type) {
            case 'error':
                return 'i-lucide-alert-circle'
            case 'transactions':
                return 'i-lucide-list'
            case 'docs':
                return 'i-lucide-file'
        }
    }

    const getColor = () => {
        switch (props.type) {
            case 'error':
                return 'error'
            case 'transactions':
                return 'neutral'
            case 'docs':
                return 'neutral'
        }
    }

    const getCount = () => {
        switch (props.type) {
            case 'error':
                return props.run.error?.length || 0
            case 'transactions':
                return props.run.transactions?.length || 0
            case 'docs':
                return props.run.docs?.length || 0
        }
    }
</script>

<template>
    <UPopover :open="open" @update:open="(val) => emit('update:open', val)">
        <UButton
            :icon="getIcon()"
            :label="`${getCount()}`"
            :color="getColor()"
            variant="outline"
            size="xs"
        />

        <template #content>
            <div class="p-4 max-w-2xl max-h-96 overflow-y-auto space-y-3">
                <div class="flex items-center justify-between mb-3">
                    <h3 class="font-semibold text-sm" :class="{ 'text-error': type === 'error' }">
                        {{ getTitle() }}
                    </h3>
                </div>

                <!-- Error Content -->
                <template v-if="type === 'error' && run.error">
                    <ul class="list-disc pl-5 space-y-2">
                        <li v-for="(err, i) in run.error" :key="i" class="text-sm text-error">
                            {{ err }}
                        </li>
                    </ul>
                </template>

                <!-- Transactions Content -->
                <template v-if="type === 'transactions' && run.transactions">
                    <div class="space-y-3">
                        <template v-for="(txs, account) in groupTransactionsByAccount(run.transactions)" :key="account">
                            <div>
                                <h4 class="font-medium text-sm mb-2 capitalize">{{ account }}</h4>
                                <div class="space-y-2">
                                    <div
                                        v-for="tx in txs"
                                        :key="tx.id"
                                        class="text-sm p-2 bg-elevated/50 rounded border border-default"
                                    >
                                        <div class="font-medium">{{ tx.id }}</div>
                                        <div class="text-muted text-sm">{{ tx.counterpart ?? tx.references?.[0] ?? '-' }}</div>
                                        <div class="font-medium">
                                            {{ Number(tx.amount).toLocaleString('da-DK', { style: 'currency', currency: 'DKK' }) }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </div>
                </template>

                <!-- Documents Content -->
                <template v-if="type === 'docs' && run.docs">
                    <div class="space-y-3">
                        <template v-for="(docsOfType, docType) in groupDocsByType(run.docs)" :key="String(docType)">
                            <div>
                                <h4 class="font-medium text-sm mb-2 capitalize">{{ docType }}</h4>
                                <ul class="list-disc pl-5 space-y-1">
                                    <li v-for="doc in docsOfType" :key="doc.id" class="text-sm">
                                        <template v-if="doc.content">
                                            <a
                                                :href="getDocUrl(doc)!"
                                                :download="doc.filename"
                                                class="text-blue-600 hover:underline font-medium"
                                            >
                                                {{ doc.filename }}
                                            </a>
                                        </template>
                                        <template v-else>
                                            <span class="text-muted">{{ doc.filename }}</span>
                                        </template>
                                        <span class="text-muted text-xs ml-1">({{ doc.mimetype }})</span>
                                    </li>
                                </ul>
                            </div>
                        </template>
                    </div>
                </template>
            </div>
        </template>
    </UPopover>
</template>