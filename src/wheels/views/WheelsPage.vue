<script setup lang="ts">
import {TALLADEGA_LOGO, TALLADEGA_WHEELS} from "@/wheels/constants/Wheels.ts";
import Button from "@/core/components/Button.vue";
</script>

<template>
  <main class="w-full h-full">
    <!-- Hero Banner Image -->
    <section class="w-full h-[371px] relative overflow-hidden">
      <img
          src="/src/assets/images/wheels/c402aa3042a129d737dc524a911947fe4291970d.png"
          alt="E5 Forged Wheels"
          class="w-full h-full object-cover"
      />
    </section>

    <!-- E5 Forged Series Section -->
    <section class="container-e5 my-16 h-[138px] grid grid-cols-[1fr_1px_1fr] align-middle">
      <div class="flex items-center justify-center">
        <img
            src="/src/assets/images/wheels/02d80e5501d4b44b3e61daf67192b4fe23242b09.png"
            alt="E5 Forged"
            class="w-3/4 object-contain"
        />
      </div>
      <div class="w-px h-full bg-e5-red lg:block"></div>
      <div class="text-center px-20 my-auto text-xl opacity-70">
        <span>
          Exclusively Forged in the USA for C8 Z06, ZR1, and E_Ray.
          Engineered for extreme performance, reduced weight, and
          maximum strength.
        </span>
      </div>
    </section>

    <section class="container-e5 my-16">
      <div class="text-center px-20 my-auto text-lg opacity-50">
        EXCLUSIVELY FORGED FOR C8 Z06, ZR1, E_RAY
      </div>

      <div class="grid grid-cols-5 gap-12 mt-12">
        <div v-for="wheel in TALLADEGA_WHEELS" class="flex flex-col items-center">
          <img
              :src="wheel.image"
              :alt="`Talladega ${wheel.finish}`"
              class="w-full h-auto object-contain mb-3"
          />
          <p class="text-[10px] tracking-[2.8px] opacity-65 text-center mb-2 uppercase">{{ wheel.finish }}</p>
          <img
              :src="TALLADEGA_LOGO"
              alt="Talladega Logo"
              class="w-full h-auto object-contain mb-2"
          />
        </div>
      </div>

      <div class="flex flex-col justify-center mt-8">
        <!-- Forged In USA & Pricing -->
        <div class="text-center space-y-2">
          <p class="text-[16px] text-e5-red tracking-[3.2px]">
            FORGED IN THE USA
          </p>
          <p class="text-xs opacity-50 tracking-[3.2px]">
            STARTING AT $2,275 PER WHEEL
          </p>
        </div>

        <!-- Explore Button -->
        <Button primary class="max-w-[300px] mx-auto mt-6">
          EXPLORE FORGED
        </Button>
      </div>
    </section>

    <section class="container-e5 py-32 grid grid-cols-2 gap-12">
      <div>
        <img
            src="/src/assets/images/wheels/24640ea00e203daa163bda379b3e86c51fc39c56.png"
            alt="Form Forged Series"
            class="max-w-[400px] mx-auto object-contain"
        />
        <div class="mt-12 max-w-[480px] mx-auto text-center">
          Engineered with forged DNA and crafted through flow forming, our Form Forged Series delivers strength and
          agility—without compromising daily drivability.
        </div>
        <div class="mt-12 max-w-[480px] mx-auto text-center tracking-[3px]">
          <p class="text-[16px] opacity-50">STARTING AT $600 PER WHEEL</p>
          <p class="text-[16px] opacity-50">EXCLUSIVELY ENGINEERED FOR CORVETTES</p>
          <p class="text-[16px] tracking-[3.2px]">
            <span class="text-e5-red">IN STOCK</span>
            <span class="text-[rgba(0,0,0,0.49)]"> FOR C6_C7_C8</span>
          </p>
        </div>
      </div>

      <div class="w-full">
        <img
            src="/src/assets/images/wheels/bf617359a30df6e52e23d25ba89f15964c216df1.png"
            alt="Daytona Logo"
            class="h-[27px] w-auto object-contain mx-auto"
        />
        <div class="flex w-full h-[240px] justify-center">
          <img
              src="/src/assets/images/wheels/77a1e54cf299ca527e8fc5695731f7a6680822fe.png"
              alt="Daytona Gloss Black"
              class="h-full ml-[-60px] w-auto object-contain"
          />
          <img
              src="/src/assets/images/wheels/d4565cf05e3fa3637a06eedfd917c1499967f34b.png"
              alt="Daytona Titanium Brushed"
              class="h-full ml-[-60px] w-auto object-contain"
          />
          <img
              src="/src/assets/images/wheels/13015d50313f3d5f39cd2616f369d0fd2c044010.png"
              alt="Daytona Bronze"
              class="h-full ml-[-60px] w-auto object-contain"
          />
        </div>

        <div class="w-full flex justify-center">
          <Button primary class="max-w-[300px] mt-8">
            EXPLORE DAYTONA
          </Button>
        </div>
      </div>
    </section>

    <section class="container-e5 py-12 grid grid-cols-2 gap-12">
      <div class="w-full">
        <img
            src="/src/assets/images/wheels/5a059fba9b6f32612b072a121dc09766ef507b86.png"
            alt="Speedway Logo"
            class="h-[27px] w-auto object-contain mx-auto"
        />
        <div class="flex w-full h-[240px] justify-center">
          <img
              src="/src/assets/images/wheels/9b42939207b0a1af6d11b3b9a2835f0304c9cedb.png"
              alt="Speedway Titanium Brushed"
              class="h-full ml-[-60px] w-auto object-contain"
          />
          <img
              src="/src/assets/images/wheels/55e2dad1e72a82c3b811737504db985db4ec5353.png"
              alt="Speedway Bronze"
              class="h-full ml-[-60px] w-auto object-contain"
          />
          <img
              src="/src/assets/images/wheels/cd19461c451031cb11b5e748b6774ae80b22a516.png"
              alt="Speedway Gloss Black"
              class="h-full ml-[-60px] w-auto object-contain"
          />
        </div>

        <div class="w-full flex justify-center">
          <Button primary class="max-w-[300px] mt-8">
            EXPLORE SPEEDWAY
          </Button>
        </div>
      </div>

      <div class="w-full">
        <img
            src="/src/assets/images/wheels/90f6c4d4b52eb6c3ec25ae4927cf62a98d647c4d.png"
            alt="Sebring Logo"
            class="h-[27px] w-auto object-contain mx-auto"
        />
        <div class="flex w-full h-[240px] justify-center">
          <img
              src="/src/assets/images/wheels/6633a5fa3fbf86ab9e4ebada3acfa83d7ae98d30.png"
              alt="Sebring Bronze"
              class="h-full ml-[-60px] w-auto object-contain"
          />
          <img
              src="/src/assets/images/wheels/57612e656f7cb177dd66a7b9e8dbaf32845675c7.png"
              alt="Sebring Gloss Black"
              class="h-full ml-[-60px] w-auto object-contain"
          />
          <img
              src="/src/assets/images/wheels/d442c91c12ba3d5e69ac89b01731b5399b849d1f.png"
              alt="Sebring Titanium Brushed"
              class="h-full ml-[-60px] w-auto object-contain"
          />
        </div>

        <div class="w-full flex justify-center">
          <Button primary class="max-w-[300px] mt-8">
            EXPLORE SEBRING
          </Button>
        </div>
      </div>
    </section>

    <div class="container-e5 mb-12">
      <div class="w-full h-px bg-black opacity-20"></div>
    </div>

    <section class="w-full h-[380px] relative overflow-hidden mb-12">
      <img
          src="/src/assets/images/wheels/80496ef76dbfffdc9aec2b05ddb00a9c06a7debc.png"
          alt="Wheel Gallery"
          class="w-full h-full object-cover"
      />
      <div class="absolute inset-0 bg-[rgba(211,29,37,0.16)]"></div>

      <div class="absolute inset-0 flex items-center justify-end pr-24">
        <div class="flex flex-col justify-center text-white text-center">
          <h2 class="text-[48px] font-franklin-heavy tracking-[-0.96px] uppercase leading-[37px] mb-3">
            WHEEL GALLERY
          </h2>
          <p class="text-[24px] tracking-[-0.48px] leading-[23px] mb-6">
            Our wheels, up close & personal.
          </p>
          <div class="flex mx-auto">
            <div class="text-[12px] tracking-[3.96px] uppercase border-b border-e5-red pb-2">
              VIEW GALLERY
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
/* Component-specific styles if needed */
</style>
