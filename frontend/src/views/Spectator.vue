<template>
  <TeamDisplay :isSpectator="true" />
</template>

<script setup>
import { onMounted } from "vue";
import TeamDisplay from "./TeamDisplay.vue";
import socket from "../utils/socket"; // Adjust path as needed

// Get sessionId from URL or another source
const sessionId = new URLSearchParams(window.location.search).get("sessionId");

onMounted(() => {
  if (sessionId) {
    socket.emit("join-session", { sessionId });
    socket.emit("get-team-members", { sessionId });
  }
});
</script>
