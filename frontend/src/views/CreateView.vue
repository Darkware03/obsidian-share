<script setup lang="ts">
import { ref, computed } from 'vue'
import { renderMarkdown } from '@/utils/markdown'
import { Copy, Plus, Trash2, Sun, Moon, Lock, Unlock, RefreshCw } from 'lucide-vue-next'
import { useDark, useToggle } from '@vueuse/core'

const isDark = useDark()
const toggleDark = useToggle(isDark)

const content = ref('')
const isLoading = ref(false)
const error = ref('')
const generatedUrl = ref('')
const isCopied = ref(false)

const isPrivate = ref(false)
const password = ref('')

const renderedMarkdown = computed(() => {
  return renderMarkdown(content.value)
})

const generatePassword = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let pass = ''
  for (let i = 0; i < 12; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  password.value = pass
}

const API_URL = '/api'

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

const handleClear = () => {
  if (confirm('¿Estás seguro de que quieres limpiar el editor?')) {
    content.value = ''
    error.value = ''
    generatedUrl.value = ''
    isPrivate.value = false
    password.value = ''
  }
}

const handleStartNew = () => {
  content.value = ''
  error.value = ''
  generatedUrl.value = ''
  isCopied.value = false
  isPrivate.value = false
  password.value = ''
}

const handlePublish = async () => {
  if (!content.value.trim()) {
    error.value = 'El contenido no puede estar vacío.'
    return
  }
  if (isPrivate.value && !password.value.trim()) {
    error.value = 'Debes ingresar o generar una contraseña para documentos privados.'
    return
  }

  error.value = ''
  isLoading.value = true
  generatedUrl.value = ''
  
  try {
    const payload: any = { content: content.value }
    if (isPrivate.value) {
      payload.isPrivate = true
      payload.password = password.value
    }

    const res = await fetch(`${API_URL}/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error || 'Error al publicar el documento')
    }

    generatedUrl.value = `${window.location.origin}/s/${data.token}`
  } catch (err: any) {
    error.value = err.message || 'Error de conexión. Inténtalo más tarde.'
  } finally {
    isLoading.value = false
  }
}

const handleCopy = async () => {
  if (!generatedUrl.value) return
  try {
    await navigator.clipboard.writeText(generatedUrl.value)
    isCopied.value = true
    setTimeout(() => {
      isCopied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy', err)
  }
}

const insertText = (before: string, after: string = '') => {
  const textarea = document.getElementById('markdown-editor') as HTMLTextAreaElement
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = content.value.substring(start, end)
  const replacement = before + selectedText + after

  content.value = content.value.substring(0, start) + replacement + content.value.substring(end)
  
  setTimeout(() => {
    textarea.focus()
    textarea.setSelectionRange(start + before.length, end + before.length)
  }, 0)
}
</script>

<template>
  <div class="h-screen w-full flex flex-col bg-background text-primary overflow-hidden">
    <!-- Header -->
    <header class="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-surface2 bg-surface shrink-0 z-10">
      <div class="flex items-center gap-3">
        <img src="/logo.svg" alt="Logo" class="w-8 h-8" />
        <div>
          <h1 class="text-lg sm:text-xl font-bold leading-tight">Obsidian Share</h1>
          <p class="text-[10px] sm:text-xs text-secondary">Tus ideas, listas para compartir</p>
        </div>
      </div>
      
      <div v-if="!generatedUrl" class="flex items-center gap-2 sm:gap-4">
        <button @click="toggleDark()" class="p-2 text-secondary hover:text-primary transition-colors" title="Alternar tema">
          <Sun v-if="isDark" class="w-4 h-4" />
          <Moon v-else class="w-4 h-4" />
        </button>
        <span v-if="error" class="text-red-400 text-xs sm:text-sm hidden sm:inline">{{ error }}</span>
        <button 
          @click="handleClear" 
          :disabled="!content || isLoading"
          class="flex items-center gap-2 px-3 py-1.5 text-sm text-secondary hover:text-red-400 transition-colors disabled:opacity-50"
          title="Limpiar editor"
        >
          <Trash2 class="w-4 h-4" />
          <span class="hidden sm:inline">Limpiar</span>
        </button>
        <div class="flex items-center gap-1 sm:gap-2 mr-2">
          <button 
            @click="isPrivate = !isPrivate" 
            :class="isPrivate ? 'text-accent' : 'text-secondary'"
            class="flex items-center gap-1.5 px-2 py-1.5 hover:bg-surface2 rounded text-xs sm:text-sm transition-colors font-medium"
            title="Alternar privacidad"
          >
            <Lock v-if="isPrivate" class="w-3.5 h-3.5" />
            <Unlock v-else class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">{{ isPrivate ? 'Privado' : 'Público' }}</span>
          </button>
          
          <div v-if="isPrivate" class="flex items-center gap-1 bg-surface2 rounded px-2">
            <input 
              v-model="password" 
              type="text" 
              placeholder="Contraseña..." 
              class="bg-transparent border-none focus:outline-none text-xs sm:text-sm w-20 sm:w-28 py-1 text-primary placeholder-secondary"
            />
            <button @click="generatePassword" class="p-1 text-secondary hover:text-primary transition-colors" title="Generar aleatoria">
              <RefreshCw class="w-3 h-3" />
            </button>
          </div>
        </div>

        <button 
          @click="handlePublish" 
          :disabled="!content || isLoading"
          class="flex items-center gap-2 px-4 py-1.5 bg-accent hover:bg-indigo-500 disabled:bg-surface2 disabled:text-secondary text-white rounded-md font-medium text-sm transition-colors"
        >
          <img v-if="isLoading" src="/logo.svg" alt="Loading" class="animate-spin w-4 h-4" />
          {{ isLoading ? 'Creando...' : 'Crear enlace' }}
        </button>
      </div>
    </header>

    <main class="flex-1 flex flex-col overflow-hidden relative">
      <div v-if="!generatedUrl" class="flex-1 flex flex-col md:flex-row overflow-hidden w-full h-full">
        
        <!-- Editor side -->
        <div class="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-surface2 bg-background overflow-hidden relative min-h-[50%] md:min-h-0">
          <div class="bg-surface px-4 py-2 flex items-center gap-2 border-b border-surface2 overflow-x-auto shrink-0 whitespace-nowrap scrollbar-hide">
            <button @click="insertText('# ', '')" class="px-2 py-1 hover:bg-surface2 rounded text-xs sm:text-sm text-secondary hover:text-primary transition-colors font-bold">H1</button>
            <button @click="insertText('## ', '')" class="px-2 py-1 hover:bg-surface2 rounded text-xs sm:text-sm text-secondary hover:text-primary transition-colors font-bold">H2</button>
            <button @click="insertText('**', '**')" class="px-2 py-1 hover:bg-surface2 rounded text-xs sm:text-sm text-secondary hover:text-primary transition-colors font-bold">B</button>
            <button @click="insertText('*', '*')" class="px-2 py-1 hover:bg-surface2 rounded text-xs sm:text-sm text-secondary hover:text-primary transition-colors italic">I</button>
            <button @click="insertText('- ', '')" class="px-2 py-1 hover:bg-surface2 rounded text-xs sm:text-sm text-secondary hover:text-primary transition-colors">• Lista</button>
            <button @click="insertText('[', '](https://)')" class="px-2 py-1 hover:bg-surface2 rounded text-xs sm:text-sm text-secondary hover:text-primary transition-colors">Enlace</button>
            <button @click="insertText('```\n', '\n```')" class="px-2 py-1 hover:bg-surface2 rounded text-xs sm:text-sm text-secondary hover:text-primary transition-colors">Código</button>
          </div>
          <textarea
            id="markdown-editor"
            v-model="content"
            class="flex-1 w-full p-4 sm:p-6 bg-background focus:outline-none resize-none text-primary font-mono text-[13px] sm:text-sm leading-relaxed"
            placeholder="Escribe tu Markdown aquí..."
          ></textarea>
        </div>

        <!-- Preview side -->
        <div class="flex-1 flex flex-col bg-surface/50 overflow-hidden min-h-[50%] md:min-h-0">
           <div class="bg-surface px-4 py-2 flex items-center border-b border-surface2 shrink-0">
             <span class="text-xs font-bold text-secondary uppercase tracking-wider">Vista previa</span>
           </div>
           <div class="flex-1 p-4 sm:p-8 overflow-y-auto">
             <div v-if="content" class="markdown-body max-w-4xl mx-auto w-full" v-html="renderedMarkdown" @click="handleContainerClick"></div>
             <div v-else class="text-secondary italic flex items-center justify-center h-full">
               Comienza a escribir para ver la vista previa...
             </div>
           </div>
        </div>
      </div>

      <!-- Result View -->
      <div v-else class="absolute inset-0 bg-background/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-4">
        <div class="bg-surface rounded-xl p-8 sm:p-12 border border-surface2 shadow-2xl text-center max-w-2xl mx-auto w-full animate-in fade-in zoom-in duration-300">
          <div class="w-16 h-16 flex items-center justify-center mx-auto mb-6">
            <img src="/logo.svg" alt="Success" class="w-12 h-12" />
          </div>
          <h2 class="text-2xl sm:text-3xl font-bold mb-4 text-primary">¡Documento publicado!</h2>
          <p class="text-secondary mb-8 max-w-md mx-auto leading-relaxed">Cualquier persona que tenga este enlace podrá ver el documento. No compartas información confidencial.</p>
          
          <div class="flex items-center gap-2 mb-8 bg-background p-3 rounded-lg border border-surface2 shadow-inner">
            <input 
              type="text" 
              readonly 
              :value="generatedUrl" 
              class="flex-1 bg-transparent border-none focus:outline-none text-primary px-2 text-sm sm:text-base w-full truncate"
              @focus="($event.target as any)?.select()"
            />
            <button 
              @click="handleCopy" 
              class="px-4 py-2 bg-surface2 hover:bg-surface2/80 transition-colors rounded text-primary flex items-center gap-2 shrink-0 font-medium"
            >
              <Copy class="w-4 h-4" />
              <span class="hidden sm:inline">{{ isCopied ? 'Copiado!' : 'Copiar enlace' }}</span>
            </button>
          </div>

          <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a :href="generatedUrl" target="_blank" class="w-full sm:w-auto px-8 py-3 bg-accent hover:bg-indigo-500 text-white rounded-lg transition-colors font-medium shadow-lg shadow-accent/20">
              Abrir documento
            </a>
            <button @click="handleStartNew" class="w-full sm:w-auto px-8 py-3 bg-surface2 hover:bg-surface2/80 text-primary rounded-lg transition-colors font-medium flex items-center justify-center gap-2">
              <Plus class="w-4 h-4" />
              Nuevo documento
            </button>
          </div>
        </div>
      </div>

    </main>
  </div>
</template>
