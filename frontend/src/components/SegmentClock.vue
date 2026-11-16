<template>
  <div
    class="segment-clock"
    :class="[`segment-clock--${size}`, { 'segment-clock--time-up': timeUp }]"
    role="timer"
    :aria-label="cells.text"
  >
    <span class="sr-only">{{ cells.text }}</span>
    <svg :viewBox="`0 0 ${width} 100`" aria-hidden="true" focusable="false">
      <g v-for="(cell, i) in layout" :key="i" :transform="`translate(${cell.x} 0)`">
        <template v-if="cell.char === ':'">
          <circle class="segment segment--on" cx="10" cy="32" r="6" />
          <circle class="segment segment--on" cx="10" cy="68" r="6" />
        </template>
        <template v-else>
          <polygon
            v-for="(on, s) in segmentsFor(cell.char)"
            :key="s"
            :points="SEGMENT_POINTS[s]"
            class="segment"
            :class="on ? 'segment--on' : 'segment--off'"
          />
        </template>
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { clockCells, segmentsFor } from '../utils/segmentClock';

interface SegmentClockProps {
  seconds: number;
  /** The timer ran out: light the segments in red. */
  timeUp?: boolean;
  size?: 'lg' | 'sm';
}

const props = withDefaults(defineProps<SegmentClockProps>(), { timeUp: false, size: 'lg' });

// Geometry of one digit cell: 60 wide, 100 tall, in a shared viewBox
const CELL = 60;
const GAP = 14;
const COLON = 20;
// a, b, c, d, e, f, g
const SEGMENT_POINTS = [
  '7,0 53,0 47,9 13,9',
  '58,3 58,47 49,40 49,12',
  '58,53 58,97 49,88 49,60',
  '7,100 53,100 47,91 13,91',
  '2,53 2,97 11,88 11,60',
  '2,3 2,47 11,40 11,12',
  '7,50 13,44 47,44 53,50 47,56 13,56',
];

const cells = computed(() => clockCells(props.seconds));

const layout = computed(() => {
  const chars = [...cells.value.minutes, ':', ...cells.value.seconds];
  let x = 0;
  return chars.map((char) => {
    const cell = { char, x };
    x += (char === ':' ? COLON : CELL) + GAP;
    return cell;
  });
});
const width = computed(
  () => layout.value.reduce((w, c) => w + (c.char === ':' ? COLON : CELL) + GAP, 0) - GAP,
);
</script>

<style scoped>
.segment-clock {
  display: inline-block;
  width: 100%;
  --segment-on: var(--color-primary, #1d4ed8);
}
.segment-clock--lg {
  max-width: 16rem;
}
.segment-clock--sm {
  max-width: 7rem;
}
.segment-clock--time-up {
  --segment-on: var(--color-error, #dc2626);
}
svg {
  display: block;
  width: 100%;
  height: auto;
}
.segment--on {
  fill: var(--segment-on);
}
.segment--off {
  fill: currentColor;
  opacity: 0.06;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
