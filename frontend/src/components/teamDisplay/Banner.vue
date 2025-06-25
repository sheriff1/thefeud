<template>
  <!-- Round Over Message -->
  <div role="alert" class="alert alert-success mb-4">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="h-6 w-6 shrink-0 stroke-current"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
    <p>{{ displayText }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface BannerProps {
  heading: string;
  paragraph: string;
}

const props = defineProps<BannerProps>();

const displayText = computed(() => {
  if (!props.heading && !props.paragraph) return '';
  if (!props.heading) return props.paragraph;
  if (!props.paragraph) return props.heading;
  return `${props.heading} ${props.paragraph}`;
});
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
