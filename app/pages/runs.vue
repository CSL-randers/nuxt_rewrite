<script setup lang="ts">
    import type { TableColumn } from '@nuxt/ui'
    import type { Run, RunStatus } from '~/types'
    import useFlattenArray from '~/composables/useFlattenArray'

    const { data, status } = await useFetch<Run[]>('/api/runs', {
        key: 'runs'
    })

    const rows = computed<Run[]>(() => useFlattenArray<Run>(data))

    const table = useTemplateRef('table')

    // Popover state
    const openPopovers = ref<Record<string, string | null>>({})

    const getColorByStatus = (status: RunStatus) => {
        return {
            udført: 'success',
            fejl: 'error',
            indlæser: 'warning',
            afventer: 'neutral'
        }[status]
    }

    const togglePopover = (runId: string, type: string) => {
        const key = `${runId}-${type}`
        openPopovers.value[key] = openPopovers.value[key] ? null : type
    }

    const columns: TableColumn<Run>[] = [
        {
            accessorKey: 'bookingDate',
            header: 'Dato',
            size: 120,
            cell: ({ row }) => {
                return new Date(row.getValue('bookingDate')).toLocaleString('da-DK', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                })
            }
        },
        {
            accessorKey: 'status',
            header: 'Status',
            size: 120,
            cell: ({ row }) => {
                const status = row.getValue('status') as RunStatus
                return h(resolveComponent('UBadge'), {
                    color: getColorByStatus(status),
                    class: 'capitalize w-fit',
                    variant: 'subtle'
                }, () => status)
            }
        },
        {
            id: 'error',
            header: 'Fejl',
            size: 100,
            enableSorting: false,
            cell: ({ row }) => {
                const errors = row.original.error
                if (!errors?.length) return null

                const key = `${row.original.id}-error`
                return h(RunsDataPopover, {
                    type: 'error',
                    run: row.original,
                    open: !!openPopovers.value[key],
                    'onUpdate:open': (val: boolean) => {
                        openPopovers.value[key] = val ? 'error' : null
                    }
                })
            }
        },
        {
            id: 'transactions',
            header: 'Transaktioner',
            size: 120,
            enableSorting: false,
            cell: ({ row }) => {
                const txs = row.original.transactions
                if (!txs?.length) return null

                const key = `${row.original.id}-transactions`
                return h(RunsDataPopover, {
                    type: 'transactions',
                    run: row.original,
                    open: !!openPopovers.value[key],
                    'onUpdate:open': (val: boolean) => {
                        openPopovers.value[key] = val ? 'transactions' : null
                    }
                })
            }
        },
        {
            id: 'docs',
            header: 'Dokumenter',
            size: 120,
            enableSorting: false,
            cell: ({ row }) => {
                const docs = row.original.docs
                if (!docs?.length) return null

                const key = `${row.original.id}-docs`
                return h(RunsDataPopover, {
                    type: 'docs',
                    run: row.original,
                    open: !!openPopovers.value[key],
                    'onUpdate:open': (val: boolean) => {
                        openPopovers.value[key] = val ? 'docs' : null
                    }
                })
            }
        }
    ]
</script>

<template>
    <UDashboardPanel id="runs">
        <template #header>
            <UDashboardNavbar title="Kørsler">
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <UTable
                ref="table"
                :data="rows"
                :columns="columns"
                :loading="status === 'pending'"
                :ui="{
                    base: 'border-separate border-spacing-0',
                    thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
                    tbody: '[&>tr]:last:[&>td]:border-b-0',
                    tr: 'group',
                    th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
                    td: 'empty:p-0 group-has-[td:not(:empty)]:border-b border-default',
                    separator: 'h-0'
                }"
            />
        </template>
    </UDashboardPanel>
</template>
