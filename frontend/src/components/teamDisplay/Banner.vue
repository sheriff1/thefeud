<template>
  <!-- Round Over Message -->
  <div class="round-over-message">
    <h4>{{ heading }}</h4>
    <p>{{ paragraph }}</p>
  </div>
</template>

<script setup lang="ts">
interface BannerProps {
  heading: string;
  paragraph: string;
}

const props = defineProps<BannerProps>();
</script>

<style>
/* Round Over Message Styles */
.round-over-message {
  position: relative; /* Ensure it stays in the flow of the page */
  width: 100%; /* Full width of the container */
  text-align: center;
  padding: 8px; /* Reduce padding for a more compact banner */
  background-color: #ccffcc; /* Light red background for visibility */
  color: #007525; /* Dark red text for contrast */
  font-size: 1rem; /* Smaller font size for the banner */
  font-weight: bold;
  border-bottom: 2px solid #007525; /* Add a border to emphasize the banner */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); /* Add a subtle shadow for depth */
  margin-bottom: 16px; /* Add spacing below the banner */
  white-space: nowrap; /* Ensure the text stays on one line */
  overflow: hidden; /* Prevent overflow if the text is too long */
  text-overflow: ellipsis; /* Add ellipsis if the text overflows */
}

.round-over-message h4,
.round-over-message p {
  display: inline; /* Ensure all text is inline */
  margin: 0; /* Remove default margins */
  font-size: inherit; /* Use the same font size as the parent */
}
</style>
