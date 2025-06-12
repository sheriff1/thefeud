describe('Home Page', () => {
  it('should load', () => {
    cy.visit('http://localhost:5173/');
    cy.contains('The Feud');
  });
});

/* ------------ Home Page Tests ------------ */
// Test for create new session button

// Test for Join as host button - with session ID input

// Test for Join as a team member button - with session ID input

// Test for Join as a spectator button - with session ID input

// Test for Join as host button - without session ID input [ERROR]

// Test for Join as a team member button - without session ID input [ERROR]

// Test for Join as a spectator button - without session ID input [ERROR]
