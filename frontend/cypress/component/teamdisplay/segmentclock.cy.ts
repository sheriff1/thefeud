import SegmentClock from '@/components/SegmentClock.vue';
import { mount } from 'cypress/vue';

describe('SegmentClock', () => {
  it('exposes the time as m:ss text and label', () => {
    mount(SegmentClock, { props: { seconds: 125 } });
    cy.get('[role="timer"]').should('have.attr', 'aria-label', '2:05').and('contain.text', '2:05');
  });

  it('shows 0:00 at zero', () => {
    mount(SegmentClock, { props: { seconds: 0 } });
    cy.get('[role="timer"]').should('contain.text', '0:00');
  });

  it('lights the right segments for 2:05', () => {
    // lit: 2 (5) + colon (2 dots) + 0 (6) + 5 (5); unlit: blank (7) + 2 (2) + 0 (1) + 5 (2)
    mount(SegmentClock, { props: { seconds: 125 } });
    cy.get('.segment--on').should('have.length', 5 + 2 + 6 + 5);
    cy.get('.segment--off').should('have.length', 7 + 2 + 1 + 2);
  });

  it('is not red at 0:00 unless the time ran out', () => {
    mount(SegmentClock, { props: { seconds: 0 } });
    cy.get('.segment-clock').should('not.have.class', 'segment-clock--time-up');
  });

  it('turns red when time is up', () => {
    mount(SegmentClock, { props: { seconds: 0, timeUp: true } });
    cy.get('.segment-clock').should('have.class', 'segment-clock--time-up');
  });

  it('updates when the seconds change', () => {
    mount(SegmentClock, { props: { seconds: 30 } }).then(({ wrapper }) => {
      cy.get('[role="timer"]').should('contain.text', '0:30');
      wrapper.setProps({ seconds: 29 });
      cy.get('[role="timer"]').should('contain.text', '0:29');
    });
  });

  it('supports the small size', () => {
    mount(SegmentClock, { props: { seconds: 5, size: 'sm' } });
    cy.get('.segment-clock').should('have.class', 'segment-clock--sm');
  });
});
