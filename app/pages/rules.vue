<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { upperFirst } from 'scule'
import { flattenBy, getPaginationRowModel } from '@tanstack/table-core'
import type { Row } from '@tanstack/table-core'
import type { RuleSelectSchema, Account } from '~/lib/db/schema/index'

import useFlattenArray from '~/composables/useFlattenArray'

type RuleRow = RuleListDto & {
  bankAccountIds: string[]
}

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UCheckbox = resolveComponent('UCheckbox')

const classBadgeColumn = 'flex flex-wrap gap-1'
const classMultiplePropsColumn = 'flex flex-col gap-1 text-sm'

const toast = useToast()
const table = useTemplateRef('table')

const globalFilterValue = ref('')

const { data: rules, status } = await useFetch<RuleListDto[]>('/api/rules', {
  key: 'rules'
})

const { data: bankAccounts } = await useFetch<Account[]>('/api/bank-accounts', {
  key: 'bankaccounts'
})

// Normalise data from the API to an array of rules and add names to related bank accounts
const rows = computed<RuleRow[]>(() => {
  const flatRules = useFlattenArray<RuleListDto>(rules.value || [])

  return flatRules.map(rule => ({
    ...rule,
    bankAccountIds: rule.relatedBankAccounts
  }))
})

// Items i dropdown-menu for hver række
function getRowItems(row: Row<RuleRow>) {
  return [
    {
      type: 'label',
      label: 'Handlinger'
    },
    {
      label: 'Rediger regel',
      icon: 'solar:ruler-cross-pen-bold-duotone'
    },
    {
      type: 'separator'
    },
    {
      label: 'Slet regel',
      icon: 'solar:trash-bin-trash-bold-duotone',
      color: 'error',
      onSelect() {
        toast.add({
          title: 'Regel slettet',
          description: 'Reglen er blevet slettet og kan evt. genoprettes under indstillinger.'
        })
      }
    }
  ]
}

const columnVisibility = ref({
  status: false,
  type: false,
  relatedBankAccounts: false,
  references_flat: false,
  counterparties_flat: false,
  classification_flat: false,
  ruleTags_flat: false
})

const columns: TableColumn<RuleRow>[] = [
  { // Selekteringskolonne
    id: 'Vælg',
    enableHiding: false,
    header: ({ table }) =>
      h(UCheckbox, {
        'modelValue': table.getIsSomePageRowsSelected()
          ? 'indeterminate'
          : table.getIsAllPageRowsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
          table.toggleAllPageRowsSelected(!!value),
        'ariaLabel': 'Vælg alle'
      }),
    cell: ({ row }) =>
      h(UCheckbox, {
        'modelValue': row.getIsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') => row.toggleSelected(!!value),
        'ariaLabel': 'Vælg række'
      })
  },
  { // RuleID
    accessorKey: 'id',
    header: 'ID',
  },
  { // Ruletags (badges)
    accessorKey: 'tags',
    header: 'Tags',
    cell: ({ row }) => {
        return h(
            'div',
            { class: classBadgeColumn },
            row.original.ruleTags?.map(tag =>
                h(UBadge, { class: 'capitalize', variant: 'solid', color: 'neutral' }, () => tag)
            )
        )
    }
  },
  { // Type (hidden, kun til filtrering)
    accessorKey: 'type',
    enableHiding: false,
    cell: ({ row }) => row.original.type
  },
  { // Status (hidden, kun til filtrering)
    accessorKey: 'status',
    enableHiding: false,
    cell: ({ row }) => row.original.status
  },
  { // Konto (hidden, kun til filtrering)
    accessorKey: 'relatedBankAccounts',
    enableHiding: false,
    cell: ({ row }) => row.original.bankAccountIds.join(', ')
  },
  { // Stamdata
    id: 'Stamdata',
    cell: ({ row }) => {
      const statusColor = { aktiv: 'text-green-600', inaktiv: 'text-red-600' }[row.original.status]
      const typeLabel = { standard: 'Standard', undtagelse: 'Undtagelse', engangs: 'Engangs' }[row.original.type]

      return h('div', { class: classMultiplePropsColumn }, [
        h('p', { class: 'font-medium' }, [
          h('span', { class: 'text-highlighted' }, 'Status: '),
          h('span', { class: statusColor }, row.original.status === 'aktiv' ? 'Aktiv' : 'Inaktiv')
        ]),
        h('p', { class: 'font-medium' }, [
          h('span', { class: 'text-highlighted' }, 'Konti: '),
          h('span', {}, row.original.bankAccountIds.join(', '))
        ]),
        h('p', { class: 'font-medium' }, [
          h('span', { class: 'text-highlighted' }, 'Type: '),
          h('span', {}, typeLabel)
        ])
      ])
    }
  },
  { // Matching references
    accessorKey: 'matching.references',
    header: 'Søgeord',
    cell: ({ row }) =>
      h('div', { class: classBadgeColumn },
        row.original.matching.references.map(text =>
          h(UBadge, { class: 'capitalize', variant: 'subtle', color: 'primary' }, () => text)
        )
      )
  },
  { // Matching counterparties
    accessorKey: 'matching.counterparties',
    header: 'Modpart',
    cell: ({ row }) =>
      h('div', { class: classBadgeColumn },
        row.original.matching.counterparties.map(text =>
          h(UBadge, { class: 'capitalize', variant: 'subtle', color: 'secondary' }, () => text)
        )
      )
  },
  { // Matching classification
    accessorKey: 'matching.classification',
    header: 'Transaktionstype',
    cell: ({ row }) =>
      h('div', { class: classBadgeColumn },
        row.original.matching.classification.map(text =>
          h(UBadge, { class: 'capitalize', variant: 'subtle', color: 'warning' }, () => text)
        )
      )
  },
  { // Datoer
    id: 'Datoer',
    cell: ({ row }) => {
      const formatDate = (date: Date | undefined) => {
        if (!date) return 'N/A'
        return new Date(date).toLocaleDateString('da-DK', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      }

      return h('div', { class: classMultiplePropsColumn }, [
        h('p', { class: 'font-medium' }, [
          h('span', { class: 'text-highlighted' }, 'Senest anvendt: '),
          h('span', {}, formatDate(row.original.lastUsed))
        ]),
        h('p', { class: 'font-medium' }, [
          h('span', { class: 'text-highlighted' }, 'Oprettet: '),
          h('span', {}, formatDate(row.original.createdAt))
        ]),
        h('p', { class: 'font-medium' }, [
          h('span', { class: 'text-highlighted' }, 'Opdateret: '),
          h('span', {}, formatDate(row.original.updatedAt))
        ])
      ])
    }
  },
  { // Match-felter til filtrering
    id: 'references_flat',
    accessorFn: row => row.matching.references.join(' '),
    enableHiding: false,
    cell: () => undefined
  },
  {
    id: 'counterparties_flat',
    accessorFn: row => row.matching.counterparties.join(' '),
    enableHiding: false,
    cell: () => undefined
  },
  {
    id: 'classification_flat',
    accessorFn: row => row.matching.classification.join(' '),
    enableHiding: false,
    cell: () => undefined
  },
  {
    id: 'ruleTags_flat',
    accessorFn: row => row.ruleTags?.join(' ') ?? '',
    enableHiding: false,
    cell: () => undefined
  },
  { // Handlinger
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'text-right' },
        h(
          UDropdownMenu,
          {
            content: {
              align: 'end'
            },
            items: getRowItems(row)
          },
          () =>
            h(UButton, {
              icon: 'i-lucide-ellipsis-vertical',
              color: 'neutral',
              variant: 'ghost',
              class: 'ml-auto'
            })
        )
      )
    }
  }
]

const statusFilter = ref('alle')
const typeFilter = ref('alle')

const statusItems = [
  { label: 'Alle', value: 'alle' },
  { label: 'Aktive', value: 'aktiv' },
  { label: 'Inaktive', value: 'inaktiv' }
]

const typeItems = [
  { label: 'Alle', value: 'alle' },
  { label: 'Standard', value: 'standard' },
  { label: 'Undtagelse', value: 'undtagelse' },
  { label: 'Engangs', value: 'engangs' }
]

const statusDropdownItems = computed(() =>
  statusItems.map(item => ({
    ...item,
    type: 'button' as const,
    onSelect() {
      statusFilter.value = item.value
    }
  }))
)

const typeDropdownItems = computed(() =>
  typeItems.map(item => ({
    ...item,
    type: 'button' as const,
    onSelect() {
      typeFilter.value = item.value
    }
  }))
)

watch(() => statusFilter.value, (newVal) => {
  if (!table?.value?.tableApi) return
  const statusColumn = table.value.tableApi.getColumn('status')
  if (!statusColumn) return
  statusColumn.setFilterValue(newVal === 'alle' ? undefined : newVal)
})

watch(() => typeFilter.value, (newVal) => {
  if (!table?.value?.tableApi) return
  const typeColumn = table.value.tableApi.getColumn('type')
  if (!typeColumn) return
  typeColumn.setFilterValue(newVal === 'alle' ? undefined : newVal)
})

const pagination = ref({
  pageIndex: 0,
  pageSize: 20
})
</script>

<template>
  <UDashboardPanel id="regler">
    <template #header>
      <UDashboardNavbar title="Konteringsregler">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <RulesAddModal />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <UInput
          v-model="globalFilterValue"
          class="max-w-sm"
          icon="solar:magnifer-bold-duotone"
          placeholder="Søg efter en regel..."
        />

        <div class="flex flex-wrap items-center gap-1.5">
          <!-- <CustomersDeleteModal :count="table?.tableApi?.getFilteredSelectedRowModel().rows.length">
            <UButton
              v-if="table?.tableApi?.getFilteredSelectedRowModel().rows.length"
              label="Delete"
              color="error"
              variant="subtle"
              icon="solar:trash-bin-trash-bold-duotone"
            >
              <template #trailing>
                <UKbd>
                  {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length }}
                </UKbd>
              </template>
            </UButton>
          </CustomersDeleteModal> -->

          <!-- Filtrering på status -->
          <UDropdownMenu
            :items="statusDropdownItems"
            :content="{ align: 'start' }"
          >
            <UButton
              :label="`Status: ${statusItems.find(i => i.value === statusFilter)?.label}`"
              color="neutral"
              variant="outline"
              trailing-icon="i-lucide-chevron-down"
            />
          </UDropdownMenu>

          <!-- Filtrering på type -->
          <UDropdownMenu 
            :items="typeDropdownItems"
            :content="{ align: 'start' }"
          >
            <UButton
              :label="`Type: ${typeItems.find(i => i.value === typeFilter)?.label}`"
              color="neutral"
              variant="outline"
              trailing-icon="i-lucide-chevron-down"
            />
          </UDropdownMenu>

          <!-- Tilføj/fjern kolonner i visningen -->
          <UDropdownMenu
            :items="
              table?.tableApi
                ?.getAllColumns()
                .filter((column: any) => column.getCanHide())
                .map((column: any) => ({
                  label: upperFirst(column.id),
                  type: 'checkbox' as const,
                  checked: column.getIsVisible(),
                  onUpdateChecked(checked: boolean) {
                    table?.tableApi?.getColumn(column.id)?.toggleVisibility(!!checked)
                  },
                  onSelect(e?: Event) {
                    e?.preventDefault()
                  }
                }))
            "
            :content="{ align: 'end' }"
          >
            <UButton
              label="Vis kolonner"
              color="neutral"
              variant="outline"
              trailing-icon="i-lucide-settings-2"
            />
          </UDropdownMenu>
        </div>
      </div>

      <UTable
        ref="table"
        v-model:global-filter="globalFilterValue"
        v-model:column-visibility="columnVisibility"
        v-model:pagination="pagination"
        :pagination-options="{
          getPaginationRowModel: getPaginationRowModel()
        }"
        class="shrink-0"
        :data="rows"
        :columns="columns"
        :loading="status === 'pending'"
        :ui="{
          base: 'table-fixed border-separate border-spacing-0',
          thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
          td: 'border-b border-default',
          separator: 'h-0'
        }"
      />

      <div class="flex items-center border-t border-default pt-4 mt-auto">
        <div class="flex-1 text-sm text-muted">
          <template v-if="table?.tableApi?.getFilteredSelectedRowModel().rows.length">
            {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length || 0 }} af
            {{ table?.tableApi?.getFilteredRowModel().rows.length || 0 }} række(r) valgt
          </template>
        </div>
        <div class="flex justify-center flex-1">
          <UPagination
            :default-page="(table?.tableApi?.getState().pagination.pageIndex || 0) + 1"
            :items-per-page="table?.tableApi?.getState().pagination.pageSize"
            :total="table?.tableApi?.getFilteredRowModel().rows.length"
            @update:page="(p: number) => table?.tableApi?.setPageIndex(p - 1)"
          />
        </div>
        <div class="flex-1"></div>
      </div>
    </template>
  </UDashboardPanel>
</template>