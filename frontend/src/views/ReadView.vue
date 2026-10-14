<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { renderMarkdown } from '@/utils/markdown'
import { Copy, AlertTriangle, Sun, Moon, Edit, Save, X, Lock } from 'lucide-vue-next'
import { useDark, useToggle } from '@vueuse/core'

const isDark = useDark()
const toggleDark = useToggle(isDark)

const route = useRoute()
const token = route.params.token as string

const content = ref('')
const isLoading = ref(true)
const error = ref('')
const isCopied = ref(false)

const needsAuth = ref(false)
const authPassword = ref('')
const isPrivate = ref(false)

const isEditing = ref(false)
const editContent = ref('')
const isSaving = ref(false)

const renderedMarkdown = computed(() => {
  return renderMarkdown(content.value)
})

const renderedEditMarkdown = computed(() => {
  return renderMarkdown(editContent.value)
})

const API_URL = import.meta.env.VITE_API_URL || '/api'

const handleContainerClick = async (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (target && target.classList.contains('copy-btn')) {
    const code = target.getAttribute('data-code')
    if (code) {
      try {
        await navigator.clipboard.writeText(decodeURIComponent(code))
        const originalText = target.innerText
        target.innerText = 'Copiado'
        setTimeout(() => {
          target.innerText = originalText
        }, 2000)
      } catch (err) {
        console.error('Failed to copy code', err)
      }
    }
  }
}

const fetchDocument = async () => {
  try {
    const res = await fetch(`${API_URL}/documents/${token}`)
    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error || 'Documento no encontrado')
    }

    isPrivate.value = data.isPrivate
    if (data.isPrivate && data.content === null) {
      needsAuth.value = true
    } else {
      content.value = data.content
    }
  } catch (err: any) {
    error.value = err.message || 'Error de conexión'
  } finally {
    isLoading.value = false
  }
}

const authenticate = async () => {
  if (!authPassword.value) return
  error.value = ''
  isLoading.value = true
  try {
    const res = await fetch(`${API_URL}/documents/${token}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: authPassword.value })
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error || 'Contraseña incorrecta')
    }
    content.value = data.content
    needsAuth.value = false
  } catch (err: any) {
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}

const startEditing = () => {
  editContent.value = content.value
  isEditing.value = true
}

const cancelEditing = () => {
  isEditing.value = false
  editContent.value = ''
}

const saveEdit = async () => {
  if (!editContent.value.trim()) return
  isSaving.value = true
  error.value = ''
  try {
    const payload: any = { content: editContent.value }
    if (isPrivate.value) {
      payload.password = authPassword.value
    }
    const res = await fetch(`${API_URL}/documents/${token}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error || 'Error al guardar')
    }
    content.value = editContent.value
    isEditing.value = false
  } catch (err: any) {
    error.value = err.message
  } finally {
    isSaving.value = false
  }
}

const handleCopyLink = async () => {
  try {
    await navigator.clipboard.writeText(window.location.href)
    isCopied.value = true
    setTimeout(() => {
      isCopied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy', err)
  }
}

onMounted(() => {
  if (token) {
    fetchDocument()
  } else {
    error.value = 'Enlace inválido'
    isLoading.value = false
  }
})
</script>

<template>
  <div class="h-screen w-full flex flex-col bg-background text-primary overflow-hidden">
    <header class="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-surface2 bg-surface shrink-0 z-10">
      <router-link to="/" class="flex items-center gap-3 text-primary hover:text-accent transition-colors">
        <img src="/logo.svg" alt="Logo" class="w-8 h-8" />
        <div>
          <span class="font-bold text-lg sm:text-xl leading-tight">Obsidian Share</span>
          <p class="text-[10px] sm:text-xs text-secondary hidden sm:block">Lector y Editor</p>
        </div>
      </router-link>
      
      <div v-if="!isLoading && !error && !needsAuth" class="flex items-center gap-2 sm:gap-4">
        <button @click="toggleDark()" class="p-2 text-secondary hover:text-primary transition-colors" title="Alternar tema">
          <Sun v-if="isDark" class="w-4 h-4" />
          <Moon v-else class="w-4 h-4" />
        </button>
        
        <template v-if="!isEditing">
          <button 
            @click="startEditing" 
            class="flex items-center gap-2 text-sm px-3 py-1.5 bg-surface2 hover:bg-surface2/80 rounded-md font-medium transition-colors text-primary"
          >
            <Edit class="w-4 h-4" />
            <span class="hidden sm:inline">Editar</span>
          </button>
          <button 
            @click="handleCopyLink" 
            class="flex items-center gap-2 text-sm px-4 py-1.5 bg-accent hover:bg-indigo-500 text-white rounded-md font-medium transition-colors"
          >
            <Copy class="w-4 h-4" />
            <span class="hidden sm:inline">{{ isCopied ? 'Enlace copiado' : 'Copiar enlace' }}</span>
          </button>
        </template>
        <template v-else>
          <button 
            @click="cancelEditing" 
            class="flex items-center gap-2 text-sm px-3 py-1.5 text-secondary hover:text-red-400 transition-colors"
          >
            <X class="w-4 h-4" />
            <span class="hidden sm:inline">Cancelar</span>
          </button>
          <button 
            @click="saveEdit"
            :disabled="isSaving || !editContent.trim()"
            class="flex items-center gap-2 text-sm px-4 py-1.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-md font-medium transition-colors"
          >
            <img v-if="isSaving" src="/logo.svg" alt="Saving" class="animate-spin w-4 h-4" />
            <Save v-else class="w-4 h-4" />
            <span class="hidden sm:inline">{{ isSaving ? 'Guardando...' : 'Guardar' }}</span>
          </button>
        </template>
      </div>
    </header>

    <main class="flex-1 flex flex-col overflow-hidden relative w-full">
      <div v-if="isLoading" class="flex-1 flex flex-col items-center justify-center text-secondary">
        <img src="/logo.svg" alt="Loading" class="animate-spin w-12 h-12 mb-4 opacity-80" />
        Cargando documento...
      </div>

      <div v-else-if="error" class="flex-1 flex flex-col items-center justify-center text-center p-4">
        <AlertTriangle class="w-16 h-16 text-yellow-500 mb-4" />
        <h2 class="text-2xl font-bold mb-2">No pudimos cargar el documento</h2>
        <p class="text-secondary mb-6">{{ error }}</p>
        <router-link to="/" class="px-6 py-2 bg-accent hover:bg-indigo-500 text-white rounded-lg transition-colors font-medium">
          Crear un documento nuevo
        </router-link>
      </div>

      <div v-else-if="needsAuth" class="flex-1 flex flex-col items-center justify-center text-center p-4">
        <div class="bg-surface rounded-xl p-8 max-w-md w-full border border-surface2 shadow-xl">
          <Lock class="w-12 h-12 text-accent mx-auto mb-4" />
          <h2 class="text-2xl font-bold mb-2">Documento Privado</h2>
          <p class="text-secondary mb-6 text-sm">Este documento requiere una contraseña para ser visualizado.</p>
          <form @submit.prevent="authenticate" class="flex flex-col gap-4">
            <input 
              v-model="authPassword" 
              type="password" 
              placeholder="Ingresa la contraseña" 
              class="w-full px-4 py-2 bg-background border border-surface2 rounded-md focus:outline-none focus:border-accent text-primary"
            />
            <button 
              type="submit" 
              :disabled="!authPassword || isLoading"
              class="w-full px-4 py-2 bg-accent hover:bg-indigo-500 text-white rounded-md font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <img v-if="isLoading" src="/logo.svg" alt="Loading" class="animate-spin w-4 h-4" />
              Acceder
            </button>
          </form>
        </div>
      </div>

      <div v-else-if="!isEditing" class="flex-1 overflow-y-auto w-full p-4 sm:p-8 md:p-12">
        <div class="w-full max-w-4xl mx-auto flex-1 flex flex-col min-h-full">
          <div class="bg-surface/50 rounded-2xl p-6 sm:p-10 border border-surface2 shadow-2xl flex-1">
            <div class="markdown-body w-full" v-html="renderedMarkdown" @click="handleContainerClick"></div>
          </div>
          <footer class="w-full mt-12 mb-8 text-center text-secondary text-sm">
            Creado con Obsidian Share
          </footer>
        </div>
      </div>

      <div v-else class="flex-1 flex flex-col md:flex-row overflow-hidden w-full h-full">
        <!-- Editor side -->
        <div class="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-surface2 bg-background overflow-hidden relative min-h-[50%] md:min-h-0">
          <textarea
            v-model="editContent"
            class="flex-1 w-full p-4 sm:p-6 bg-background focus:outline-none resize-none text-primary font-mono text-[13px] sm:text-sm leading-relaxed"
            placeholder="Edita tu Markdown aquí..."
          ></textarea>
        </div>
        <!-- Preview side -->
        <div class="flex-1 flex flex-col bg-surface/50 overflow-hidden min-h-[50%] md:min-h-0">
           <div class="bg-surface px-4 py-2 flex items-center border-b border-surface2 shrink-0">
             <span class="text-xs font-bold text-secondary uppercase tracking-wider">Vista previa</span>
           </div>
           <div class="flex-1 p-4 sm:p-8 overflow-y-auto">
             <div class="markdown-body max-w-4xl mx-auto w-full" v-html="renderedEditMarkdown" @click="handleContainerClick"></div>
           </div>
        </div>
      </div>
    </main>
  </div>
</template>
