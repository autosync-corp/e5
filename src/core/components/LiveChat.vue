<script lang="ts" setup>
import { defineAsyncComponent, onMounted, onUnmounted, ref } from 'vue';

const loaded = ref(false);
const LiveChatWidget = defineAsyncComponent(() =>
  import('@livechat/widget-vue').then((m) => m.LiveChatWidget)
);

let remove = () => {};

onMounted(() => {
  const load = () => {
    loaded.value = true;
    remove();
  };
  const opts: AddEventListenerOptions = { once: true, passive: true };
  window.addEventListener('pointerdown', load, opts);
  window.addEventListener('keydown', load, opts);
  window.addEventListener('touchstart', load, opts);
  remove = () => {
    window.removeEventListener('pointerdown', load);
    window.removeEventListener('keydown', load);
    window.removeEventListener('touchstart', load);
  };
});

onUnmounted(() => remove());
</script>

<template>
  <LiveChatWidget v-if="loaded" license="16984875" />
</template>
