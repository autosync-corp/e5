<script setup lang="ts">
  import Hero from "@/core/components/Hero.vue";
  import Button from "@/core/components/Button.vue";
</script>

<template>
  <main class="w-full h-full">
    <Hero>
      <video autoplay loop muted playsinline class="w-full h-full object-cover">
        <source src="/src/core/assets/videos/E5LPVID-.mp4" type="video/mp4" />
      </video>
    </Hero>

    <section class="container-e5 text-center my-20">
      <div>
        <h1 class="font-franklin-heavy text-6xl text-black mb-6 font-black">
          EXCLUSIVELY ENGINEERED FOR CORVETTES
        </h1>
        <p class="font-sans font-bold text-26 text-black/70 mx-auto">
          E5 Wheels are exclusively engineered for Corvettes—no universal fitments, no compromises.
          Every design is forged to align with the car's aggressive stance, meet its high-performance demands, and complement its unmistakable identity.
        </p>
      </div>
    </section>

    <section class="container-e5 flex mt-8 bg-gray-50 py-20">
      <div class="grid grid-flow-row auto-rows-min grid-cols-2">
        <div class="col-start-1 row-start-1">
          <img src="/src/core/assets/images/form-forged-logo-black.png" alt="Form Forged" class="w-1/2 h-auto mx-auto" />
        </div>
        <div class="col-start-1 row-start-2">
          <img src="/src/core/assets/images/form-forged-group.png" alt="Form Forged Wheels" class="w-4/5 h-auto mx-auto" />
        </div>
        <div class="col-start-1 row-start-3">
          <p class="text-xl text-black/70 text-center mt-8 font-black w-4/5 mx-auto">
            Engineered with forged DNA and crafted through flow forming, our Form Forged Series delivers strength and agility—without compromising daily drivability.
          </p>
        </div>
        <div class="col-start-1 row-start-4 flex justify-center items-center mt-6">
          <Button  primary>EXPLORE FORM FORGED</Button>
        </div>
        <div class="col-start-2 row-start-1">
          <img src="/src/core/assets/images/e5-forged-logo.png" alt="Form Forged" class="w-3/4 h-auto mx-auto" />
        </div>
        <div class="col-start-2 row-start-2 mx-10">
          <div class="relative flex justify-end">
            <img src="/src/core/assets/images/talladega-render-gloss-black-red.png" alt="Talladega Render" class="w-2/5 absolute bottom-0 left-0 ms-16" style="z-index: 1" />
            <img src="/src/core/assets/images/e5-talladega-rear.png" alt="Talladega Rear" class="me-10 w-1/2" />
          </div>
        </div>
        <div class="col-start-2 row-start-3">
          <p class="text-xl text-black/70 text-center mt-8 font-black w-4/5 mx-auto">
            Exclusively Forged in the USA for C8 Z06, ZR1, and E Ray. Engineered for extreme performance, reduced weight, and maximum strength.
          </p>
        </div>
        <div class="col-start-2 row-start-4 flex justify-center items-center mt-6">
          <Button primary>EXPLORE E5 FORGED</Button>
        </div>
      </div>
    </section>

    <section class="container-e5 max-w-[1500px] flex justify-between mx-auto py-32">
      <div class="grid grid-cols-1 auto-rows-min">
        <img src="/src/core/assets/images/asset-29.png" alt="Asset 29" class="w-[264px] h-auto" />
        <h1 class="text-5xl font-franklin-medium mt-12">OUR PROCESS</h1>
        <p class="max-w-[700px] text-xl text-black/70 mt-6">
          At E5, we approach every wheel with a process rooted in precision engineering, model-specific fitment, and an uncompromising attention to detail. From concept design to final finish, we engineer each product to enhance performance, complement the car’s design, and uphold the standards that define the Corvette platform.
        </p>
        <div class="mt-20">
          <Button primary>LEARN MORE</Button>
        </div>
      </div>
      <div class="h-[438px]">
        <img src="/src/core/assets/images/talladega-exo.png" alt="Talladega Exo" class="w-full max-w-[438px] h-auto" />
      </div>
    </section>

    <section class="py-20 bg-gray-50">
      <div class="container-e5">
        <h2 class="text-48 text-e5-red font-normal">GALLERIES</h2>
        <p class="text-24 text-black/60 uppercase mt-5 mb-20">
          From detailed finishes to full builds— experience E5 in our galleries.
        </p>

        <div class="grid grid-cols-[1fr_4px_1fr] gap-12">
          <div class="my-auto relative">
            <img src="/src/core/assets/images/e5-gallery-1.png" alt="Vette Gallery" class="w-full max-w-[715px] h-[714px] object-cover md:h-auto md:min-h-[400px]" />
            <div class="absolute bottom-0 left-0 w-full cursor-pointer h-full hover:bg-black/30 flex justify-center items-center">
              <router-link to="/gallery" class="mt-auto mb-10">
                <Button primary class="py-4">
                  VIEW VETTE <br /> GALLERY
                </Button>
              </router-link>
            </div>
          </div>
          <div class="bg-e5-separator h-full min-h-[660px]"></div>
          <div class="my-auto relative">
            <img src="/src/core/assets/images/e5-gallery-2.png" alt="Wheel Gallery" class="w-full max-w-[715px] h-[714px] object-cover md:h-auto md:min-h-[400px]" />
            <div class="absolute bottom-0 left-0 w-full cursor-pointer h-full hover:bg-black/30 flex justify-center items-center">
              <router-link to="/gallery/wheel" class="mt-auto mb-10">
                <Button primary class="mt-auto mb-10 py-4">
                  VIEW WHEEL <br /> GALLERY
                </Button>
              </router-link>>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
