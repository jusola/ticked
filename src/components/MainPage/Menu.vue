<script>

import net from '@/modules/net'
import store from '@/modules/store'
import backend from '@/modules/backend'
import database from '@/modules/database'

import NewListModal from '@/components/MainPage/NewListModal'

export default {
  name: 'Menu',
  data () {
    return {
      loading: false,
      state: store.state,
      db: database,
      error: null,
      isActive: true,
      newListProps: {
        listName: null
      },
      isModalActive: false,
      currentElem: 'allLists'
    }
  },
  methods: {
    setList (newList) {
      this.setView('tasks')
      this.setMenuView(newList)
      backend.setList(newList)
    },
    logout () {
      this.setMenuView('logout')
      backend.logout()
    },
    newList () {
      this.setMenuView('newList')
      const modal = this.$buefy.modal.open({
        parent: this,
        component: NewListModal,
        hasModalCard: true,
        trapFocus: true,
        onCancel: () => {
          console.log('Modal closed')
          store.viewBack()
        }
      })
    },
    setView (newView) {
      store.setView(newView)
    },
    setMenuView (newView) {
      store.setMenuView(newView)
    },
    allLists () {
      this.setView('lists')
      this.setMenuView('allLists')
      store.setAllLists()
    },
    deleteList (list) {
      backend.deleteList(list)
    }
  }
}
</script>

<template>
  <b-sidebar
    position="static"
    fullheight
    mobile="show"
    open
  >
    <b-menu class="is-sidebar-menu">
      <b-menu-list :label="$t('menu.label.lists')">
        <b-menu-item
          :active="state.menuView === 'allLists'"
          icon="view-sequential"
          :label="$t('menu.label.allLists')"
          @click="allLists()"
        />
        <b-menu-item
          v-for="list in state.lists"
          :key="list.listid"
          :active="state.menuView === list.listid"
          @click="setList(list.listid)"
        >
          <template #label>
            {{ list.name }}
            <b-dropdown
              aria-role="list"
              class="is-pulled-right"
              append-to-body
            >
              <template #trigger>
                <b-icon
                  icon="dots-vertical"
                />
              </template>
              <b-dropdown-item
                aria-role="listitem"
                @click="deleteList(list)"
              >
                Delete list
              </b-dropdown-item>
            </b-dropdown>
          </template>
        </b-menu-item>
        <b-menu-item
          tag="a"
          icon="plus"
          :active="state.menuView === 'newList'"
          :label="$t('menu.label.newlist')"
          @click="newList"
        />
      </b-menu-list>
      <b-menu-list :label="$t('menu.label.actions')">
        <b-menu-item
          :label="$t('menu.label.settings')"
          :active="state.menuView === 'settings'"
          icon="settings"
          @click="setView('settings'); setMenuView('settings')"
        />
        <b-menu-item
          :label="$t('menu.label.logout')"
          :active="state.menuView === 'logout'"
          icon="logout"
          @click="logout"
        />
      </b-menu-list>
    </b-menu>
    <div class="loadingindicator">
      <b-loading
        :active="db.updating !== 0"
        :can-cancel="false"
        :is-full-page="false"
      />
    </div>
  </b-sidebar>
</template>

<style></style>
