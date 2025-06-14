<template>
  <div class="navbar bg-base-100 shadow-sm">
    <div class="flex-1">
      <a class="btn btn-ghost text-xl text-base-content !text-base-content">The Feud</a>
    </div>
    <div class="flex-none">
      <ul class="menu menu-horizontal px-1">
        <li><a class="text-base-content !text-base-content">How To Play</a></li>
        <li><a class="text-base-content !text-base-content">About</a></li>
        <li><a class="text-base-content !text-base-content">Log Out</a></li>
      </ul>
    </div>
  </div>
  <router-view />
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
