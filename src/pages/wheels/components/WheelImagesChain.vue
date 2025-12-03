<script setup lang="ts">
import Button from "@/core/components/Button.vue";

const props = defineProps({
  logo: {
    type: String,
    required: true,
  },
  brand: {
    type: String,
    required: true,
  },
  images: {
    type: Array<{ image: string; finish: string}>,
    required: true,
  },
  btnAction: Function,
  btnLink: String,
  btnText: String,
});
</script>

<template>
  <div class="w-full overflow-hidden">
    <img
        :src="props.logo"
        :alt="`${props.brand} Logo`"
        class="h-[27px] w-auto object-contain mx-auto"
    />
    <div class="flex w-full h-[240px] justify-center ml-[50px] lg:ml-[30px]">
      <img
          v-for="i in props.images"
          :src="i.image"
          :alt="i.finish"
          class="ml-[-100px] lg:ml-[-60px] w-auto object-contain"
          style="width: 100%; max-width: calc((100% / 3) + 30px)"
      />
    </div>

    <div v-if="props.btnText" class="w-full flex justify-center">
      <Button primary class="max-w-[300px] mt-8" :link="props.btnLink" :action="props.btnAction">{{props.btnText}}</Button>
    </div>
  </div>
</template>
