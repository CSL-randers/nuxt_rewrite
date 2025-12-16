<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { upperFirst } from 'scule'
import { flattenBy, getPaginationRowModel } from '@tanstack/table-core'
import type { Row } from '@tanstack/table-core'
import type { Rule } from '~/types'
import useFlattenArray from '~/composables/useFlattenArray'

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UCheckbox = resolveComponent('UCheckbox')

const classBadgeColumn = 'flex flex-wrap gap-1'
const classMultiplePropsColumn = 'flex flex-col gap-1 text-sm'

const toast = useToast()
const table = useTemplateRef('table')

const globalFilterValue = ref('')

const { data, status } = await useFetch<Rule[]>('/api/rules', {
  lazy: true
})

// Normaliserer data fra API'et til en array af regler
const rows = computed<Rule[]>(() => useFlattenArray<Rule>(data));

// Items i dropdown-menu for hver række
function getRowItems(row: Row<Rule>) {
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
  bankAccountName: false,
  matchText_flat: false,
  matchCounterparty_flat: false,
  ruleTags_flat: false
})

const columns: TableColumn<Rule>[] = [
  { // Selekteringskolonne
    id: 'select',
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
  { // Søgeord (badges)
    accessorKey: 'matchText',
    header: 'Søgeord',
    cell: ({ row }) => {
      
      return h(
        'div',
        { class: classBadgeColumn },
        row.original.matchText?.map((text: string, index: number) =>
          h(UBadge, 
            { 
              class: 'capitalize', 
              variant: 'subtle', 
              color: 'primary'
            }, 
            () => text
          )
        )
      )
    }
  },
  { // Modpart eller afsender/modtager (badges)
    accessorKey: 'matchCounterparty',
    header: 'Modpart',
    cell: ({ row }) => {
      
      return h(
        'div',
        { class: classBadgeColumn },
        row.original.matchCounterparty?.map((text: string, index: number) =>
          h(UBadge, 
            { 
              class: 'capitalize', 
              variant: 'subtle', 
              color: 'primary'
            }, 
            () => text
          )
        )
      )
    }
  },
  { // Transaktionstype
    accessorKey: 'matchType',
    header: 'Transaktionstype',
    cell: ({ row }) => row.original.matchType
  },
  { // Ruletags (badges)
    accessorKey: 'ruleTags',
    header: 'Tags',
    cell: ({ row }) => {
        return h(
            'div',
            { class: classBadgeColumn },
            row.original.ruleTags?.map((tag: any) =>
                h(UBadge, { class: 'capitalize', variant: 'subtle', color: 'secondary' }, () =>
                    tag.name
                )
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
    accessorKey: 'bankAccountName',
    enableHiding: false,
    cell: ({ row }) => row.original.bankAccountName
  },
  { // Status, Konto og Type
    id: 'statusType',
    cell: ({ row }) => {
      const statusColor = {
        aktiv: 'text-green-600',
        inaktiv: 'text-red-600'
      }[row.original.status]

      const typeLabel = {
        standard: 'Standard',
        undtagelse: 'Undtagelse',
        engangs: 'Engangs'
      }[row.original.type]

      return h('div', { class: classMultiplePropsColumn }, [
        h('p', { class: 'font-medium' }, [
          h('span', { class: statusColor }, row.original.status === 'aktiv' ? 'Aktiv' : 'Inaktiv')
        ]),
        h('p', { class: 'font-medium text-highlighted' }, `Konto: ${row.original.bankAccountName}`),
        h('p', { class: 'text-muted' }, `Type: ${typeLabel}`)
      ])
    }
  },
  { // Datoer
    id: 'dates',
    cell: ({ row }) => {
      const formatDate = (date: Date | null) => {
        if (!date) return 'N/A'
        return new Date(date).toLocaleDateString('da-DK', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      }

      return h('div', { class: classMultiplePropsColumn }, [
        h('p', { class: 'font-medium text-highlighted' }, `Senest anvendt: ${formatDate(row.original.lastUsed)}`),
        h('p', { class: 'text-muted' }, `Oprettet: ${formatDate(row.original.createdAt)}`),
        h('p', { class: 'text-muted' }, `Opdateret: ${formatDate(row.original.updatedAt)}`)
      ])
    }
  },
  { // matchText_flat (hidden, kun til filtrering)
    id: 'matchText_flat',
    accessorFn: (row: Rule) =>
      Array.isArray(row.matchText) ? row.matchText.join(' ') : (row.matchText ?? ''),
    enableHiding: false,
    cell: () => null
  },
  { // matchCounterparty_flat (hidden, kun til filtrering)
    id: 'matchCounterparty_flat',
    accessorFn: (row: Rule) =>
      Array.isArray(row.matchCounterparty) ? row.matchCounterparty.join(' ') : (row.matchCounterparty ?? ''),
    enableHiding: false,
    cell: () => null
  },
  { // ruleTags_flat (hidden, kun til filtrering)
    id: 'ruleTags_flat',
    accessorFn: (row: Rule) =>
      Array.isArray(row.ruleTags) ? row.ruleTags.map((t: any) => t?.name).filter(Boolean).join(' ') : '',
    enableHiding: false,
    cell: () => null
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
  pageSize: 15
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
          <!-- <RulesAddModal /> -->
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