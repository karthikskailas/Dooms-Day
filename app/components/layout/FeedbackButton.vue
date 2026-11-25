<script setup lang="ts">
// Footer link that opens a small native dialog (focus trap and Esc come with <dialog>) for reporting a mistake or
// sending a suggestion. Posts to /api/feedback.
const route = useRoute()
const dialog = ref<HTMLDialogElement | null>(null)
const message = ref('')
const contact = ref('')
const state = ref<'idle' | 'sending' | 'sent' | 'error'>('idle')
const error = ref('')

function open() {
  state.value = 'idle'
  dialog.value?.showModal()
}

async function send() {
  state.value = 'sending'
  try {
    await $fetch('/api/feedback', { method: 'POST', body: { message: message.value, contact: contact.value, page: route.fullPath } })
    message.value = ''
    state.value = 'sent'
  } catch (e) {
    error.value = (e as { statusMessage?: string }).statusMessage ?? 'Could not send. Try again.'
    state.value = 'error'
  }
}

const field = 'w-full rounded-control border border-line-strong bg-surface px-3 text-body text-ink placeholder:text-ink-subtle'
</script>

<template>
  <button type="button" class="font-semibold text-ink underline underline-offset-2 transition-colors duration-150 hover:text-gold-soft" @click="open">
    Report a mistake
  </button>

  <dialog ref="dialog" class="m-auto w-[min(92vw,26rem)] rounded-control border border-line-strong bg-surface-raised p-5 text-ink backdrop:bg-black/70" aria-labelledby="feedback-title">
    <div v-if="state === 'sent'" class="space-y-4">
      <h2 id="feedback-title" class="font-display text-2xl font-bold uppercase">Thank you</h2>
      <p class="text-body text-ink-muted">Your note reached me. I will look at it.</p>
      <button type="button" class="min-h-11 rounded-control bg-doom-green px-4 text-control font-semibold uppercase tracking-[0.06em] text-ink hover:bg-doom-green-bright hover:text-void" @click="dialog?.close()">Close</button>
    </div>
    <form v-else class="space-y-3" @submit.prevent="send">
      <h2 id="feedback-title" class="font-display text-2xl font-bold uppercase">Report a mistake</h2>
      <p class="text-meta text-ink-muted">Wrong order, missing title, broken link, or an idea. Tell me and I will fix it.</p>
      <label class="block space-y-1">
        <span class="text-meta font-semibold text-ink-muted">What is wrong or missing?</span>
        <textarea v-model="message" required minlength="5" maxlength="1000" rows="4" :class="[field, 'py-2']" />
      </label>
      <label class="block space-y-1">
        <span class="text-meta font-semibold text-ink-muted">Your email or handle (optional, if you want a reply)</span>
        <input v-model="contact" type="text" maxlength="100" :class="[field, 'min-h-11']">
      </label>
      <p v-if="state === 'error'" class="text-meta text-danger-text" role="alert">{{ error }}</p>
      <div class="flex justify-end gap-2">
        <button type="button" class="min-h-11 rounded-control border border-line-strong px-4 text-control font-semibold text-ink-muted hover:text-ink" @click="dialog?.close()">Cancel</button>
        <button type="submit" :disabled="state === 'sending'" class="min-h-11 rounded-control bg-doom-green px-4 text-control font-semibold uppercase tracking-[0.06em] text-ink hover:bg-doom-green-bright hover:text-void disabled:opacity-60">
          {{ state === 'sending' ? 'Sending' : 'Send' }}
        </button>
      </div>
    </form>
  </dialog>
</template>
