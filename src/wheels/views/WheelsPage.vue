<script setup lang="ts">
// Wheel images - using absolute paths as per project convention
// Talladega Series
const imgE5ForgedLogo2 = '/src/assets/images/wheels/02d80e5501d4b44b3e61daf67192b4fe23242b09.png'
const imgTalladegaRenderBrushedAluminumGlossClearFront341 = '/src/assets/images/wheels/c5130d4e56f6e2437cc78fe4904cdcbc6e716569.png'
const imgTalladegaRenderBrushedAluminumNoClearFront342 = '/src/assets/images/wheels/5aadb0394c4c49db86d0f64235e3f00404c7faf7.png'
const imgTalladegaRenderBrushedBronzeSatinFront342 = '/src/assets/images/wheels/edd03fa4648dfa8d219b2e1dd0aef9cc737c3b27.png'
const imgTalladegaLogo4 = '/src/assets/images/wheels/3a0f898a970a7108262be2cdc91dcdde57744bd4.png'
const imgTalladegaRenderGlossBlackRedE52 = '/src/assets/images/wheels/afdec958cf713eb929ae510752b31594f43c1a4f.png'
const imgTalladegaRenderBrushedRoseGoldFront343 = '/src/assets/images/wheels/464d2ace3214351d17a75848ec4bddc985f8c836.png'
const imgArrows3 = '/src/assets/images/wheels/176c8b6c187068573fad042f69c021856e9a1c88.png'
const imgE5Ftallshots68301 = '/src/assets/images/wheels/c402aa3042a129d737dc524a911947fe4291970d.png'

// Form Forged Series
const imgFormForgedSoloBlack1 = '/src/assets/images/wheels/24640ea00e203daa163bda379b3e86c51fc39c56.png'

// Daytona Series
const imgDaytonaLogo2 = '/src/assets/images/wheels/bf617359a30df6e52e23d25ba89f15964c216df1.png'
const imgDaytonaBkGlossBlack5Lug00011 = '/src/assets/images/wheels/77a1e54cf299ca527e8fc5695731f7a6680822fe.png'
const imgDaytonaBbtGlossBronzeBrushedFaceTintedClear5Lug00011 = '/src/assets/images/wheels/13015d50313f3d5f39cd2616f369d0fd2c044010.png'
const imgDaytonaTiuTitaniumBrushed5Lug00012 = '/src/assets/images/wheels/d4565cf05e3fa3637a06eedfd917c1499967f34b.png'

// Speedway Series
const imgSpeedwayLogo2 = '/src/assets/images/wheels/5a059fba9b6f32612b072a121dc09766ef507b86.png'
const imgSpeedwayTitBrsh001 = '/src/assets/images/wheels/9b42939207b0a1af6d11b3b9a2835f0304c9cedb.png'
const imgSpeedwayGlBlk001Revb = '/src/assets/images/wheels/cd19461c451031cb11b5e748b6774ae80b22a516.png'
const imgSpeedwayBrnz001 = '/src/assets/images/wheels/55e2dad1e72a82c3b811737504db985db4ec5353.png'

// Sebring Series
const imgSebringLogo3 = '/src/assets/images/wheels/90f6c4d4b52eb6c3ec25ae4927cf62a98d647c4d.png'
const imgSebringBrnz001 = '/src/assets/images/wheels/6633a5fa3fbf86ab9e4ebada3acfa83d7ae98d30.png'
const imgSebringTitBrsh001 = '/src/assets/images/wheels/d442c91c12ba3d5e69ac89b01731b5399b849d1f.png'
const imgSebringGlBlk001Reva = '/src/assets/images/wheels/57612e656f7cb177dd66a7b9e8dbaf32845675c7.png'

// Gallery CTA
const imgE5TalladegaRed69811 = '/src/assets/images/wheels/80496ef76dbfffdc9aec2b05ddb00a9c06a7debc.png'

// Decorative lines
const imgLine4 = '/src/assets/images/wheels/9f2983f58873740e54ef4f7726b8030466082880.svg'
const imgLine1 = '/src/assets/images/wheels/aa900d6f6e6f8b4285088b93cdf1875afc73148b.svg'
</script>

<template>
  <main class="w-full min-h-screen bg-white relative">
    <!-- Hero Banner Image -->
    <section class="w-full h-[371px] relative overflow-hidden">
      <img
        :src="imgE5Ftallshots68301"
        alt="E5 Forged Wheels"
        class="w-full h-full object-cover"
      />
    </section>

    <!-- E5 Forged Series Section -->
    <section class="container-e5 py-16">
      <div class="max-w-[1536px] mx-auto">
        <!-- E5 Forged Logo -->
        <div class="mb-12">
          <img
            :src="imgE5ForgedLogo2"
            alt="E5 Forged"
            class="h-[54px] w-auto object-contain"
          />
        </div>

        <!-- Forged Series Content -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <!-- Left: Talladega Wheels -->
          <div class="space-y-8">
            <!-- Wheel Gallery Row 1 -->
            <div class="grid grid-cols-5 gap-4">
              <!-- Wheel 1: Smoked Polished -->
              <div class="flex flex-col items-center">
                <img
                  :src="imgTalladegaRenderBrushedAluminumGlossClearFront341"
                  alt="Talladega Smoked Polished"
                  class="w-full h-auto object-contain mb-3"
                />
                <img
                  :src="imgTalladegaLogo4"
                  alt="Talladega Logo"
                  class="w-full h-auto object-contain mb-2"
                />
                <p class="text-[14px] font-franklin-book text-[rgba(0,0,0,0.62)] tracking-[2.8px] text-center">
                  SMOKED POLISHED
                </p>
              </div>

              <!-- Wheel 2: Satin Grey -->
              <div class="flex flex-col items-center">
                <img
                  :src="imgTalladegaRenderBrushedAluminumNoClearFront342"
                  alt="Talladega Satin Grey"
                  class="w-full h-auto object-contain mb-3"
                />
                <img
                  :src="imgTalladegaLogo4"
                  alt="Talladega Logo"
                  class="w-full h-auto object-contain mb-2"
                />
                <p class="text-[14px] font-franklin-book text-[rgba(0,0,0,0.62)] tracking-[2.8px] text-center">
                  SATIN GREY
                </p>
              </div>

              <!-- Wheel 3: Podium Bronze -->
              <div class="flex flex-col items-center">
                <img
                  :src="imgTalladegaRenderBrushedBronzeSatinFront342"
                  alt="Talladega Podium Bronze"
                  class="w-full h-auto object-contain mb-3"
                />
                <img
                  :src="imgTalladegaLogo4"
                  alt="Talladega Logo"
                  class="w-full h-auto object-contain mb-2"
                />
                <p class="text-[14px] font-franklin-book text-[rgba(0,0,0,0.62)] tracking-[2.8px] text-center">
                  PODIUM BRONZE
                </p>
              </div>

              <!-- Wheel 4: Gloss Black -->
              <div class="flex flex-col items-center">
                <img
                  :src="imgTalladegaRenderGlossBlackRedE52"
                  alt="Talladega Gloss Black"
                  class="w-full h-auto object-contain mb-3"
                />
                <img
                  :src="imgTalladegaLogo4"
                  alt="Talladega Logo"
                  class="w-full h-auto object-contain mb-2"
                />
                <p class="text-[14px] font-franklin-book text-[rgba(0,0,0,0.62)] tracking-[2.8px] text-center">
                  GLOSS BLACK
                </p>
              </div>

              <!-- Wheel 5: Podium Gold -->
              <div class="flex flex-col items-center">
                <img
                  :src="imgTalladegaRenderBrushedRoseGoldFront343"
                  alt="Talladega Podium Gold"
                  class="w-full h-auto object-contain mb-3"
                />
                <img
                  :src="imgTalladegaLogo4"
                  alt="Talladega Logo"
                  class="w-full h-auto object-contain mb-2"
                />
                <p class="text-[14px] font-franklin-book text-[rgba(0,0,0,0.62)] tracking-[2.8px] text-center">
                  PODIUM GOLD
                </p>
              </div>
            </div>

            <!-- Forged In USA & Pricing -->
            <div class="text-center space-y-2">
              <p class="text-[16px] font-franklin-book text-e5-red tracking-[3.2px]">
                FORGED IN THE USA
              </p>
              <p class="text-[16px] font-franklin-book text-[rgba(0,0,0,0.49)] tracking-[3.2px]">
                STARTING AT $2,275 PER WHEEL
              </p>
            </div>

            <!-- Explore Button -->
            <div class="flex justify-center">
              <button class="bg-e5-red text-white px-12 py-4 rounded-[14px] text-[16px] font-excon tracking-[5.6px] opacity-85 hover:opacity-100 transition-opacity">
                EXPLORE FORGED
              </button>
            </div>
          </div>

          <!-- Right: Description -->
          <div class="flex flex-col items-center justify-center space-y-8">
            <div class="w-px h-[138px] bg-black opacity-20 hidden lg:block"></div>
            <p class="text-[24px] font-excon text-black text-center leading-[30px] opacity-70 max-w-[656px]">
              Exclusively Forged in the USA for C8 Z06, ZR1, and E_Ray. Engineered for extreme performance, reduced weight, and maximum strength.
            </p>
            <p class="text-[16px] font-franklin-book text-[rgba(0,0,0,0.49)] tracking-[3.2px] text-center">
              EXCLUSIVELY FORGED FOR C8 Z06, ZR1, E_RAY
            </p>
            <img
              :src="imgArrows3"
              alt="Navigate"
              class="w-[70px] h-[24px] opacity-70 cursor-pointer hover:opacity-100 transition-opacity"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Separator Line -->
    <div class="container-e5 my-12">
      <div class="w-full h-px bg-black opacity-20"></div>
    </div>

    <!-- Form Forged Series Section -->
    <section class="container-e5 py-16">
      <div class="max-w-[1536px] mx-auto">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <!-- Left: Logo and Description -->
          <div class="space-y-8">
            <img
              :src="imgFormForgedSoloBlack1"
              alt="Form Forged Series"
              class="h-[137px] w-auto object-contain"
            />
            <p class="text-[24px] font-excon text-black leading-[30px] opacity-70 max-w-[656px]">
              Engineered with forged DNA and crafted through flow forming, our Form Forged Series delivers strength and agility—without compromising daily drivability.
            </p>
            <div class="space-y-2">
              <p class="text-[16px] font-franklin-book text-[rgba(0,0,0,0.49)] tracking-[3.2px]">
                EXCLUSIVELY ENGINEERED FOR CORVETTES
              </p>
              <p class="text-[16px] font-franklin-book tracking-[3.2px]">
                <span class="text-e5-red">IN STOCK</span>
                <span class="text-[rgba(0,0,0,0.49)]"> FOR C6_C7_C8</span>
              </p>
              <p class="text-[16px] font-franklin-book text-[rgba(0,0,0,0.49)] tracking-[3.2px]">
                STARTING AT $600 PER WHEEL
              </p>
            </div>
          </div>

          <!-- Right: Placeholder for now (will add wheel collections) -->
          <div></div>
        </div>
      </div>
    </section>

    <!-- Daytona Series -->
    <section class="container-e5 py-16">
      <div class="max-w-[1536px] mx-auto">
        <div class="flex justify-end mb-8">
          <img
            :src="imgDaytonaLogo2"
            alt="Daytona Logo"
            class="h-[27px] w-auto object-contain"
          />
        </div>

        <div class="grid grid-cols-3 gap-6 mb-8">
          <img
            :src="imgDaytonaBkGlossBlack5Lug00011"
            alt="Daytona Gloss Black"
            class="w-full h-auto object-contain"
          />
          <img
            :src="imgDaytonaTiuTitaniumBrushed5Lug00012"
            alt="Daytona Titanium Brushed"
            class="w-full h-auto object-contain"
          />
          <img
            :src="imgDaytonaBbtGlossBronzeBrushedFaceTintedClear5Lug00011"
            alt="Daytona Bronze"
            class="w-full h-auto object-contain"
          />
        </div>

        <div class="flex justify-end">
          <button class="bg-e5-red text-white px-12 py-4 rounded-[14px] text-[16px] font-excon tracking-[5.6px] opacity-85 hover:opacity-100 transition-opacity">
            EXPLORE DAYTONA
          </button>
        </div>
      </div>
    </section>

    <!-- Speedway Series -->
    <section class="container-e5 py-16">
      <div class="max-w-[1536px] mx-auto">
        <div class="mb-8">
          <img
            :src="imgSpeedwayLogo2"
            alt="Speedway Logo"
            class="h-[28px] w-auto object-contain"
          />
        </div>

        <div class="grid grid-cols-3 gap-6 mb-8">
          <img
            :src="imgSpeedwayTitBrsh001"
            alt="Speedway Titanium Brushed"
            class="w-full h-auto object-contain"
          />
          <img
            :src="imgSpeedwayBrnz001"
            alt="Speedway Bronze"
            class="w-full h-auto object-contain"
          />
          <img
            :src="imgSpeedwayGlBlk001Revb"
            alt="Speedway Gloss Black"
            class="w-full h-auto object-contain"
          />
        </div>

        <div class="flex justify-start">
          <button class="bg-e5-red text-white px-12 py-4 rounded-[14px] text-[16px] font-excon tracking-[5.6px] opacity-85 hover:opacity-100 transition-opacity">
            EXPLORE SPEEDWAY
          </button>
        </div>
      </div>
    </section>

    <!-- Sebring Series -->
    <section class="container-e5 py-16">
      <div class="max-w-[1536px] mx-auto">
        <div class="flex justify-end mb-8">
          <img
            :src="imgSebringLogo2"
            alt="Sebring Logo"
            class="h-[29px] w-auto object-contain"
          />
        </div>

        <div class="grid grid-cols-3 gap-6 mb-8">
          <img
            :src="imgSebringBrnz001"
            alt="Sebring Bronze"
            class="w-full h-auto object-contain"
          />
          <img
            :src="imgSebringGlBlk001Reva"
            alt="Sebring Gloss Black"
            class="w-full h-auto object-contain"
          />
          <img
            :src="imgSebringTitBrsh001"
            alt="Sebring Titanium Brushed"
            class="w-full h-auto object-contain"
          />
        </div>

        <div class="flex justify-end">
          <button class="bg-e5-red text-white px-12 py-4 rounded-[14px] text-[16px] font-excon tracking-[5.6px] opacity-85 hover:opacity-100 transition-opacity">
            EXPLORE SEBRING
          </button>
        </div>
      </div>
    </section>

    <!-- Separator Line -->
    <div class="container-e5 my-12">
      <div class="w-full h-px bg-black opacity-20"></div>
    </div>

    <!-- Wheel Gallery CTA Section -->
    <section class="w-full h-[380px] relative overflow-hidden">
      <img
        :src="imgE5TalladegaRed69811"
        alt="Wheel Gallery"
        class="w-full h-full object-cover"
      />
      <div class="absolute inset-0 bg-[rgba(211,29,37,0.16)]"></div>

      <div class="absolute inset-0 flex items-center justify-end pr-24">
        <div class="text-white text-right">
          <h2 class="text-[48px] font-franklin-heavy tracking-[-0.96px] uppercase leading-[37px] mb-3">
            WHEEL GALLERY
          </h2>
          <p class="text-[24px] font-franklin-book tracking-[-0.48px] leading-[23px] mb-6">
            Our wheels, up close & personal.
          </p>
          <div class="flex items-center justify-end space-x-4">
            <p class="text-[12px] font-franklin-book tracking-[3.96px] uppercase">
              VIEW GALLERY
            </p>
            <div class="w-[118px] h-px bg-e5-red"></div>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
/* Component-specific styles if needed */
</style>