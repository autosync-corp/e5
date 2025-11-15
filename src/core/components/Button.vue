<script setup lang="ts">
import {useRouter} from "vue-router";

const router = useRouter();
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
    props.link.startsWith('/') ? router.push(props.link) : router.push({name: props.link});
  } else if (props.action) {
    props.action();
  }
}
</script>
<template>
  <button
    :disabled="props.disabled"
    :class="{
      'bg-e5-red text-white font-franklin-demi border-0 px-8 py-5 text-[14px] tracking-[5.6px] cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg': props.primary,
      'bg-transparent text-e5-red font-sans border-2 border-e5-red px-6 py-3 text-[14px] tracking-[5.6px] cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg': props.secondary,
      'bg-black text-white font-sans border-0 px-6 py-3 text-[14px] tracking-[5.6px] cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg': !props.primary && !props.secondary,
      'opacity-50 cursor-not-allowed hover:-translate-y-0 hover:shadow-none': props.disabled,
    }"
    @click="onClick"
  >
    <slot></slot>
  </button>
</template>