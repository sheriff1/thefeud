/* ------------ Team Display Tests ------------ */

// Test for team display loading

/* ---- Join Team Dialog section ---- */
// Test for join team dialog showing (correct team radio btns, join btn disabled, and form fields)

// Test for join team dialog allowing player name input

// Test for join team dialog not allowing empty player name input [ERROR]

/* ---- Answers Board section ---- */
// Test for team display showing correct scores

// Test for team display showing correct question

// Test for team display showing correct answers - not guessed

// Test for team display showing correct answers - guessed correctly

// Test for team display showing correct answers - guessed incorrectly (strike X graphic)

/* ---- Team Panel section ---- */
// Test for team display showing correct team names

// Test for team disply showing correct number of strikes

// Test for team display showing correct winning team emoji

// Test for team display being able to edit team A name & showing correctly after save

// Test for team display being able to edit team B name & showing correctly after save

// Test for team display showing player names in the correct team

/* ---- Game Info section ---- */
// Test for team display showing correct round number

// Test for team display showing correct timer value

// Test for team display showing correct round multiplier

/* ---- Banner section ---- */
// Test for team display showing winning banner

/* ---- Floating Button section ---- */
// Test for floating buttons showing correctly on team display

// Test for floating button copying session ID to clipboard

// Test for floating button muting audio

/* ---- Misc. ----- */

// Test timeout

// Test invite dialog showing correctly

// Test invite dialog closing correctly

///// SAMPLE FOR simulating with posted data
// describe('Team Display', () => {
//   it('shows correct info after host setup', () => {
//     // 1. Create the session
//     cy.request('POST', 'http://localhost:4000/api/create-session/test-session');

//     // 2. (If needed) Use UI to set up teams, question, answers
//     // cy.visit('http://localhost:5173/host?sessionId=test-session');
//     // ...simulate host actions to set up state...

//     // 3. Visit the team display page
//     cy.visit('http://localhost:5173/team?sessionId=test-session');

//     // 4. Assert expected info
//     cy.contains('Team A');
//     // ...other assertions...
//   });
// });
