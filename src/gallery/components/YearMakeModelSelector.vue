<script setup lang="ts">
import Button from "@/core/components/Button.vue";
</script>

<template>
  <!-- Choose Your Corvette Filter Section -->
  <section class="w-full bg-[rgba(233,233,233,0.61)] py-10">
    <div
        class="bg-e5-red h-[39px] shadow-[0px_18px_14px_-14px_rgba(0,0,0,0.25)] flex items-center justify-center mb-8">
      <p class="font-sans text-xl text-white tracking-[20px] uppercase">
        CHOOSE YOUR CORVETTE
      </p>
    </div>

    <div class="container-e5 flex gap-6 items-center px-[164px]">
      <div class="flex-1 border-2 border-e5-red bg-white h-[40px] px-4 flex items-center">
        <select class="w-full bg-transparent font-sans text-base tracking-[5.6px] opacity-70 uppercase outline-none">
          <option>MODEL</option>
        </select>
      </div>
      <div class="flex-1 border-2 border-e5-red bg-white h-[40px] px-4 flex items-center">
        <select class="w-full bg-transparent font-sans text-base tracking-[5.6px] opacity-70 uppercase outline-none">
          <option>TRIM</option>
        </select>
      </div>
      <div class="flex-1 border-2 border-e5-red bg-white h-[40px] px-4 flex items-center">
        <select class="w-full bg-transparent font-sans text-base tracking-[5.6px] opacity-70 uppercase outline-none">
          <option>YEAR</option>
        </select>
      </div>
      <Button>
        SEARCH
      </Button>
    </div>
  </section>
</template>
