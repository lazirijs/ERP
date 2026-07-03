<template>
  <container-app type="fixed">
    <div class="h-screen w-full flex flex-col items-center justify-center">
      <div class="text-center space-y-4 mb-12">
        <h1 class="text-red-500 text-6xl font-bold">404</h1>
        <span class="text-2xl font-bold">{{ $t("pageNotFound") }}</span>
      </div>
      <el-button @click="$router.go(-1)" class="mb-24">{{ $t("back") }}</el-button>
    </div>
  </container-app>
</template>