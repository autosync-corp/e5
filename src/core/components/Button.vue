<script setup lang="ts">
const props = defineProps({
  primary: {
    type: Boolean,
    default: false
  },
  secondary: {
    type: Boolean,
    default: false
  },
  disabled: Boolean,
  link: String,
  action: Function,
});

const onClick = () => {
  if (props.link) {
    window.location.href = props.link;
  } else if (props.action) {
    props.action();
  }
}
</script>
<template>
  <button
    class="uppercase"
    :disabled="props.disabled"
    :class="{
      'bg-e5-red text-white font-franklin-demi border-0 px-8 py-4 text-[14px] tracking-[5.6px] cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg': props.primary,
      'bg-transparent text-e5-red font-sans border-2 border-e5-red px-6 py-2 text-[14px] tracking-[5.6px] cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg': props.secondary,
      'bg-black text-white font-sans border-0 px-6 py-3 text-[14px] tracking-[5.6px] cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg': !props.primary && !props.secondary,
      'opacity-50 cursor-not-allowed hover:-translate-y-0 hover:shadow-none': props.disabled,
    }"
    @click="onClick"
  >
    <slot></slot>
  </button>
</template>