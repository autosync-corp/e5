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
  if (props.action) {
    props.action();
  }
}
</script>
<template>
  <a
    v-if="props.link"
    :href="props.link"
    class="uppercase inline-block text-center no-underline"
    :class="[
      props.class,
      {
        'bg-e5-red border-2 border-e5-red text-white font-franklin-demi border-0 px-6 py-4 text-[14px] tracking-[5.6px] cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg': props.primary,
        'bg-transparent text-e5-red font-sans border-2 border-e5-red px-6 py-4 text-[14px] tracking-[5.6px] cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg': props.secondary,
        'bg-black text-white font-sans border-0 px-6 py-4 text-[14px] tracking-[5.6px] cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg': !props.primary && !props.secondary,
        'opacity-50 cursor-not-allowed hover:-translate-y-0 hover:shadow-none pointer-events-none': props.disabled,
      }
    ]"
    :aria-disabled="props.disabled || undefined"
  >
    <slot></slot>
  </a>
  <button
    v-else
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
