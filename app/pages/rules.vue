<script setup lang="ts">
    import { computed, ref } from 'vue'

    // Fetch rules with related data
    const { data: rulesData, pending, error, refresh } = await useFetch('/api/rules-detailed', { 
        default: () => [],
        server: false // Ensure it runs on client to avoid SSR issues
    })

    // Search functionality
    const searchQuery = ref('')

    // Tab items for filtering by type
    const typeTabItems = [{
        label: 'Alle typer',
        value: 'all'
        }, {
        label: 'Standard',
        value: 'default'
        }, {
        label: 'Undtagelse',
        value: 'exception'
        }, {
        label: 'Midlertidig',
        value: 'temporary'
    }]

    // Tab items for filtering by status
    const statusTabItems = [{
        label: 'Alle',
        value: 'all'
        }, {
        label: 'Aktive',
        value: 'active'
        }, {
        label: 'Inaktive', 
        value: 'inactive'
    }]

    const selectedTypeTab = ref('all')
    const selectedStatusTab = ref('all')

    // Search and filter rules
    const filteredRules = computed(() => {
    let filtered = rulesData.value

    // Filter by type
    if (selectedTypeTab.value !== 'all') {
        filtered = filtered.filter(rule => rule.ruleType === selectedTypeTab.value)
    }

    // Filter by status
    if (selectedStatusTab.value !== 'all') {
        const isActive = selectedStatusTab.value === 'active'
        filtered = filtered.filter(rule => rule.active === isActive)
    }

    // Search in all text fields
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(rule => {
        // Search in rule fields
        const ruleMatch = Object.values(rule).some(value => 
            value && value.toString().toLowerCase().includes(query)
        )
        
        // Search in matching criteria
        const criteriaMatch = rule.matchingCriteria && Object.values(rule.matchingCriteria).some(value =>
            value && value.toString().toLowerCase().includes(query)
        )
        
        // Search in accounting info
        const accountingMatch = rule.accountingInfo && Object.values(rule.accountingInfo).some(value =>
            value && value.toString().toLowerCase().includes(query)
        )
        
        // Search in tags
        const tagsMatch = rule.tags && rule.tags.some(tag =>
            tag.name.toLowerCase().includes(query)
        )
        
        return ruleMatch || criteriaMatch || accountingMatch || tagsMatch
        })
    }

    return filtered
    })

    // Group rules by type
    const groupedRules = computed(() => {
    const groups = new Map()
    
    filteredRules.value.forEach(rule => {
        const type = rule.ruleType
        if (!groups.has(type)) {
        groups.set(type, [])
        }
        groups.get(type).push(rule)
    })
    
    return Array.from(groups.entries()).map(([type, items]) => ({
        key: type,
        label: getTypeLabel(type),
        items
    }))
    })

    // Helper function for type labels
    function getTypeLabel(type: string) {
    const labels = {
        'default': 'Standard regler',
        'exception': 'Undtagelser',
        'temporary': 'Midlertidige regler'
    }
    return labels[type] || type
    }

    // Table columns
    const columns = [
        {
            key: 'id',
            label: 'ID',
            sortable: true
        }, {
            key: 'active',
            label: 'Status'
        }, {
            key: 'tags',
            label: 'Tags'
        }, {
            key: 'lastUsed',
            label: 'Sidst brugt',
            sortable: true
        }, {
            key: 'createdAt',
            label: 'Oprettet',
            sortable: true
        }, {
            key: 'actions',
            label: ''
    }]

    // Action handlers
    function createNewRule() {
    // TODO: Implement rule creation modal
    console.log('Create new rule')
    }

    function showRuleDetails(rule: any) {
    // TODO: Implement rule details modal
    console.log('Show details for rule:', rule.id)
    }

    function editRule(rule: any) {
    // TODO: Implement rule editing
    console.log('Edit rule:', rule.id)
    }

    function deleteRule(rule: any) {
    // TODO: Implement rule deletion with confirmation
    console.log('Delete rule:', rule.id)
    }
</script>

<template>
  <UDashboardPage>
    <UDashboardPanel :grow="1">
      <UDashboardNavbar title="Konteringsregler">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        
        <template #trailing>
          <CreateRuleModal />
        </template>

        <template #right>
          <div class="flex items-center gap-3">
            <!-- Search -->
            <UInput
              v-model="searchQuery"
              placeholder="Søg i regler..."
              icon="i-lucide-search"
              size="sm"
              class="w-48"
            />
            
            <!-- Type filter -->
            <UTabs
              v-model="selectedTypeTab"
              :items="typeTabItems"
              :content="false"
              size="xs"
            />
            
            <!-- Status filter -->
            <UTabs
              v-model="selectedStatusTab"
              :items="statusTabItems"
              :content="false"
              size="xs"
            />
          </div>
        </template>
      </UDashboardNavbar>

      <UDashboardPanelContent class="p-0">
        <div v-if="pending" class="flex items-center justify-center p-8">
          <UIcon name="i-lucide-loader-2" class="size-6 animate-spin" />
        </div>
        
        <!-- Error state -->
        <UEmpty
          v-else-if="error"
          title="Fejl ved indlæsning"
          description="Der opstod en fejl ved indlæsning af konteringsregler. Prøv at genindlæse siden."
          icon="i-lucide-alert-circle"
        >
          <template #actions>
            <UButton 
              label="Genindlæs" 
              icon="i-lucide-refresh-cw"
              @click="refresh()"
            />
          </template>
        </UEmpty>
        
        <!-- Empty state when no rules -->
        <UEmpty
          v-else-if="!filteredRules.length"
          title="Ingen konteringsregler fundet"
          :description="searchQuery ? 'Prøv at justere dine søgekriterier' : 'Opret din første konteringsregel for at komme i gang'"
          icon="i-lucide-file-text"
        >
          <template #actions>
            <UButton 
              label="Opret ny regel" 
              icon="i-lucide-plus"
              color="primary"
              @click="createNewRule"
            />
          </template>
        </UEmpty>
        
        <!-- Table with rules -->
        <UTable 
          v-else
          :rows="groupedRules" 
          :columns="columns"
          :group="{ key: 'key', label: 'label' }"
          class="w-full"
        >
          <!-- Custom status cell -->
          <template #active-data="{ row }">
            <UBadge 
              :label="row.active ? 'Aktiv' : 'Inaktiv'"
              :color="row.active ? 'success' : 'error'"
              variant="soft"
            />
          </template>

          <!-- Tags badges -->
          <template #tags-data="{ row }">
            <div class="flex flex-wrap gap-1">
              <UBadge 
                v-for="tag in row.tags" 
                :key="tag.id"
                :label="tag.name"
                :style="{ backgroundColor: tag.color }"
                variant="solid"
                size="xs"
              />
              <span v-if="!row.tags?.length" class="text-gray-400 text-sm">Ingen tags</span>
            </div>
          </template>

          <!-- Custom date formatting -->
          <template #lastUsed-data="{ row }">
            <span v-if="row.lastUsed" class="text-gray-500">
              {{ new Date(row.lastUsed).toLocaleDateString('da-DK') }}
            </span>
            <span v-else class="text-gray-400">Aldrig</span>
          </template>

          <template #createdAt-data="{ row }">
            <span class="text-gray-500">
              {{ new Date(row.createdAt).toLocaleDateString('da-DK') }}
            </span>
          </template>

          <!-- Actions column -->
          <template #actions-data="{ row }">
            <UButtonGroup size="sm" orientation="horizontal">
              <UButton 
                color="neutral" 
                variant="ghost" 
                icon="i-lucide-eye"
                @click="showRuleDetails(row)"
              />
              <UButton 
                color="neutral" 
                variant="ghost" 
                icon="i-lucide-edit"
                @click="editRule(row)"
              />
              <UButton 
                color="error" 
                variant="ghost" 
                icon="i-lucide-trash"
                @click="deleteRule(row)"
              />
            </UButtonGroup>
          </template>

          <!-- Expandable row content for matching criteria and accounting info -->
          <template #expand="{ row }">
            <div class="p-4 bg-gray-50 dark:bg-gray-800/50 space-y-4">
              <!-- Matching Criteria -->
              <div v-if="row.matchingCriteria">
                <h4 class="font-semibold text-sm mb-2">Matching kriterier</h4>
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div v-if="row.matchingCriteria.transactionText">
                    <span class="text-gray-500">Transaktionstekst:</span>
                    <p>{{ row.matchingCriteria.transactionText }}</p>
                  </div>
                  <div v-if="row.matchingCriteria.counterParty">
                    <span class="text-gray-500">Modpart:</span>
                    <p>{{ row.matchingCriteria.counterParty }}</p>
                  </div>
                  <div v-if="row.matchingCriteria.transactionType">
                    <span class="text-gray-500">Transaktionstype:</span>
                    <p>{{ row.matchingCriteria.transactionType }}</p>
                  </div>
                  <div v-if="row.matchingCriteria.amountMin || row.matchingCriteria.amountMax">
                    <span class="text-gray-500">Beløbsinterval:</span>
                    <p>{{ row.matchingCriteria.amountMin || '0' }} - {{ row.matchingCriteria.amountMax || '∞' }}</p>
                  </div>
                </div>
              </div>

              <!-- Accounting Info -->
              <div v-if="row.accountingInfo">
                <h4 class="font-semibold text-sm mb-2">Konterings information</h4>
                <div class="grid grid-cols-3 gap-4 text-sm">
                  <div v-if="row.accountingInfo.accountPrimary">
                    <span class="text-gray-500">Primær konto:</span>
                    <p>{{ row.accountingInfo.accountPrimary }}</p>
                  </div>
                  <div v-if="row.accountingInfo.accountSecondary">
                    <span class="text-gray-500">Sekundær konto:</span>
                    <p>{{ row.accountingInfo.accountSecondary }}</p>
                  </div>
                  <div v-if="row.accountingInfo.accountTertiary">
                    <span class="text-gray-500">Tertiær konto:</span>
                    <p>{{ row.accountingInfo.accountTertiary }}</p>
                  </div>
                  <div v-if="row.accountingInfo.postingText">
                    <span class="text-gray-500">Bogføringstekst:</span>
                    <p>{{ row.accountingInfo.postingText }}</p>
                  </div>
                  <div v-if="row.accountingInfo.note">
                    <span class="text-gray-500">Note:</span>
                    <p>{{ row.accountingInfo.note }}</p>
                  </div>
                </div>
              </div>

              <!-- Bank Accounts -->
              <div v-if="row.bankAccounts?.length">
                <h4 class="font-semibold text-sm mb-2">Tilknyttede bankkonti</h4>
                <div class="flex flex-wrap gap-2">
                  <UBadge 
                    v-for="account in row.bankAccounts"
                    :key="account.id"
                    :label="account.name"
                    variant="outline"
                    size="sm"
                  />
                </div>
              </div>
            </div>
          </template>
        </UTable>
      </UDashboardPanelContent>
    </UDashboardPanel>
  </UDashboardPage>
</template>