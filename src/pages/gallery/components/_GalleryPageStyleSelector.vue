<script setup lang="ts">
const emits = defineEmits(['detailed-view']);
const props = defineProps({
  detailedView: Boolean,
})
</script>
<template>
  <section class="container-e5 flex gap-4 justify-center mt-8">
    <div class="w-[70px] h-[70px] flex items-center justify-center cursor-pointer"
         :class="props.detailedView && 'grayscale'"
         @click="emits('detailed-view', false)">
      <svg width="65" height="60" viewBox="0 0 65 60" fill="none" xmlns="http://www.w3.org/2000/svg"
           xmlns:xlink="http://www.w3.org/1999/xlink">
        <rect x="0.5" y="0.5" width="63.9479" height="58.6615" :stroke="!props.detailedView ? '#d31d25' : '#999'"/>
        <rect x="12.8379" y="10.573" width="39.5961" height="38.2018" fill="url(#pattern0_1779_366)"/>
        <defs>
          <pattern id="pattern0_1779_366" patternContentUnits="objectBoundingBox" width="1" height="1">
            <use xlink:href="#image0_1779_366" transform="scale(0.00704225 0.00729927)"/>
          </pattern>
          <image id="image0_1779_366" width="142" height="137" preserveAspectRatio="none"
                 xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAI4AAACJCAYAAAD6+ACwAAAACXBIWXMAAAsSAAALEgHS3X78AAAB1klEQVR4nO3dMU7DQBBAUYy4BnRQcf+LQEXJRUKVlER8ic1k9V4VKU1G+p7C0drHx/Pr6eEOvH9/Hb99//nyZo6FHm/9A7hPT+cP166EW/nrFWiO/3Wew8YhEQ6JcEiEQyIcEuGQCIdEOCTCIREOiXBIhEMiHBLhkAiHRDgkwiERDolwSIRDIhwS4ZAIh+RyrupeThBeY441bBwSJzkX2W0OG4dEOCTCIREOiXBIhEMiHBLhkPjLYajpc9g4JMfpNDpshrJxSIRDIhwS4ZAIh0Q4JMIhEQ6JcEgOLzpba5c5bBwSx2MW2W0OG4dEOCTCIREOiXBIhEMiHBLhkAiHRDgkwiERDolwSIRDIhwS4ZAIh0Q4JMIhEQ6JcEiEQyIcEuGQeFztUNPnsHFIHAFeZLc5bBwS4ZAIh0Q4JMIhEQ6JcEjcOR5q+hw2DokXnZHYOCTCIREOiXBIhEMiHBLhkAiHRDgkXnS22C5z2DgkTjksstscNg6JcEiEQyIcEuGQCIdEOCTCIREOiXBIhEMiHBLhkAiHRDgkwiERDolwSIRDIhwS4ZAIh0Q4JMIh8bjaoabPYeOQOAK8yG5z2DgkwiERDolwSIRDIhwS4ZC4czzU9DlsHJIfCp6S+q4+exUAAAAASUVORK5CYII="/>
        </defs>
      </svg>
    </div>
    <div class="w-[70px] h-[70px] flex items-center justify-center cursor-pointer"
         :class="!props.detailedView && 'grayscale'"
         @click="emits('detailed-view', true)">
      <svg width="65" height="60" viewBox="0 0 65 60" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <rect x="0.5" y="0.5" width="63.9479" height="58.6615" :stroke="props.detailedView ? '#d31d25' : '#999'"/>
        <rect x="15.8594" y="10.573" width="34.1568" height="38.3222" fill="url(#pattern0_1779_247)"/>
        <defs>
          <pattern id="pattern0_1779_247" patternContentUnits="objectBoundingBox" width="1" height="1">
            <use xlink:href="#image0_1779_247" transform="scale(0.00813008 0.00724638)"/>
          </pattern>
          <image id="image0_1779_247" width="123" height="138" preserveAspectRatio="none" xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHsAAACKCAYAAACKCTXDAAAACXBIWXMAAAsSAAALEgHS3X78AAABtUlEQVR4nO3dMVLCUBRAUeO4Deiwcv8bwcrSjYQKi9+YsYDx3XMqCgrm3bwmk3y26+myvwz38f21/fadz/P7+Dm8PvsH8Dhv9w9Hrv7/5i/bOnkONjtE7BCxQ8QOETtE7BCxQ8QOETtE7BCxQ8QOETtE7BCxQ8QOETtE7BCxQ8QOETtE7BCxQ8QOETtE7BCxQ8QOETtE7BCxQ8QOETtE7BCxQ8QOETtE7BCxQ8QOETtE7JCf4ywLB7UeMXkONjvEQbWLyXOw2SFih4gdInaI2CFih4gdInaI2CFih4gdInaI2CFih3h4YTF5DjY7ZNv3sRcyC5sdInaI2CFih4gdInaI2CFih4gdsl1Pl/G30I680jP5nvidzQ7xYt9i8hxsdojYIWKHiB0idojYIWKHiB0idojYIWKHiB0idojYIWKHiB0idojYIWKHiB0idojYIWKHiB0idojYIWKHiB0idojYIWKHiB0idojYIWKHiB0idojYIWKHiB0idoj/9VpMnoPNDhE7xEG1i8lzsNkhYoeIHSJ2iNghYoeIHSJ2iNghYoeIHSJ2iNghYod4UmUxeQ42O+QG/t9A/+d06n0AAAAASUVORK5CYII="/>
        </defs>
      </svg>
    </div>

    <!--    <div class="w-[70px] h-[70px] bg-[#d9d9d9] flex items-center justify-center cursor-pointer" @click="emits('detailed-view', false)">-->
    <!--      <svg width="36" height="36" viewBox="0 0 36 36">-->
    <!--        <path d="M18 2L22.5 14H35L25 22L29 34L18 26L7 34L11 22L1 14H13.5L18 2Z" :fill="!props.detailedView ? '#d31d25' : '#999'"/>-->
    <!--      </svg>-->
    <!--    </div>-->
    <!--    <div class="w-[70px] h-[70px] bg-[#d9d9d9] flex items-center justify-center cursor-pointer" @click="emits('detailed-view', true)">-->
    <!--      <svg width="36" height="36" viewBox="0 0 36 36">-->
    <!--        <path d="M18 2L22.5 14H35L25 22L29 34L18 26L7 34L11 22L1 14H13.5L18 2Z" :fill="props.detailedView ? '#d31d25' : '#999'"/>-->
    <!--      </svg>-->
    <!--    </div>-->
  </section>
</template>
