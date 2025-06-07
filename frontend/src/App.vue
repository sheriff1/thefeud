<template>
  <div>
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { auth, signInAnonymously } from './firebase';

signInAnonymously(auth);
</script>

<style>
body {
  margin: 0;
  font-family: Avenir, Helvetica, Arial, sans-serif;
}
</style>
