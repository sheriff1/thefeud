describe('Home Page', () => {
  it('should load', () => {
    cy.visit('http://localhost:5173/');
    cy.contains('The Feud');
  });
});
