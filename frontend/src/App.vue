<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useDark } from '@vueuse/core'

// Initialize dark mode
useDark()
</script>

<template>
  <RouterView />
</template>
