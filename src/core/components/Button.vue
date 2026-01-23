<script setup lang="ts">
interface Props {
  primary?: boolean;
  secondary?: boolean;
  disabled?: boolean;
  link?: string;
  action?: Function;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  primary: false,
  secondary: false,
  disabled: false,
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
    :class="[
      props.class,
      {
        'bg-e5-red border-2 border-e5-red text-white font-franklin-demi border-0 px-6 py-4 text-[14px] tracking-[5.6px] cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg': props.primary,
        'bg-transparent text-e5-red font-sans border-2 border-e5-red px-6 py-4 text-[14px] tracking-[5.6px] cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg': props.secondary,
        'bg-black text-white font-sans border-0 px-6 py-4 text-[14px] tracking-[5.6px] cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg': !props.primary && !props.secondary,
        'opacity-50 cursor-not-allowed hover:-translate-y-0 hover:shadow-none': props.disabled,
      }
    ]"
    @click="onClick"
  >
    <slot></slot>
  </button>
</template>