<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Row } from '@tanstack/table-core'
import { getPaginationRowModel } from '@tanstack/table-core'
import type { AccountSelectSchema } from '~/lib/db/schema'

const toast = useToast()
const table = useTemplateRef('table')
const globalFilterValue = ref('')

const modalOpen = ref(false)
const editingAccountId = ref<string | null>(null)

const { data: accounts, pending, refresh: refreshAccounts } = await useAsyncData<AccountSelectSchema[]>(
  'bank-accounts',
  async () => $fetch('/api/bank-accounts')
)

const rows = computed(() => [...(accounts.value ?? [])])

// Dropdown-menu for actions
function getRowItems(row: Row<AccountSelectSchema>) {
  return [
    { type: 'label', label: 'Handlinger' },
    {
      label: 'Rediger bankkonto',
      icon: 'solar:ruler-cross-pen-bold-duotone',
      onSelect() { handleEditAccount(row) }
    },
    { type: 'separator' },
    {
      label: 'Slet bankkonto',
      icon: 'solar:trash-bin-trash-bold-duotone',
      color: 'error',
      onSelect() {
        toast.add({
          title: 'Bankkonto slettet',
          description: 'Reglen er blevet slettet og kan evt. genoprettes under indstillinger.'
        })
      }
    }
  ]
}

const columns: TableColumn<AccountSelectSchema>[] = [
  { // id
    accessorKey: 'id',
    id: 'id',
    header: 'Bankkonto'
  },
  { // statusAccount
    accessorKey: 'statusAccount',
    id: 'statusAccount',
    header: 'Statuskonto'
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

const pagination = ref({ pageIndex: 0, pageSize: 20 })

function handleAddAccount() {
  editingAccountId.value = null
  modalOpen.value = true
}

function handleEditAccount(row: Row<AccountSelectSchema>) {
  editingAccountId.value = row.original.id
  modalOpen.value = true
}

async function handleSaved() {
  editingAccountId.value = null
  await refreshAccounts()
  modalOpen.value = false
}
</script>

<template>
  <UDashboardPanel id="settings-banking">
    <template #header>
      <UDashboardNavbar title="Bankintegration">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            class="font-bold rounded-full"
            icon="i-lucide-plus"
            :label="'Ny bankkonto'"
            @click="handleAddAccount"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <UInput
          v-model="globalFilterValue"
          class="max-w-sm"
          icon="solar:magnifer-bold-duotone"
          placeholder="Søg efter en bankkonto..."
        />
      </div>

      <UTable
        ref="table"
        v-model:global-filter="globalFilterValue"
        v-model:pagination="pagination"
        :pagination-options="{
          getPaginationRowModel: getPaginationRowModel()
        }"
        class="shrink-0"
        :data="rows"
        :columns="columns"
        :loading="pending"
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
      
      <BankingAccountModal
        v-model:open="modalOpen"
        :account-id="editingAccountId"
        @saved="handleSaved"
      />
    </template>
  </UDashboardPanel>
</template>
