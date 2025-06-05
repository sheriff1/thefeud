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

/* ------------ Host Dashboard Tests ------------ */
// Test for host dashboard loading

/* ---- Manage Question and Answers section ---- */
// Test for upload CSV file

// Test for Select from library button showing dialog

// Test for adding question to remove the validation message

// Test for adding 2 answers to remove the validation message

// Test for add answer

// Test for remove answer

// Test for download template button

// Test for remove all answers button

// Test for Save Question and Answers button

// Test for Save Question and Answers button with empty question [ERROR]

// Test for Save Question and Answers button with < 2 answers [ERROR]

// Test for remove all answers button with < 2 answers [ERROR]

/* ---- Manual Overrides section ---- */
// Test for Team A points not accepting non-numeric input or less than 0 input [ERROR]

// Test for Team B points not accepting non-numeric input or less than 0 input [ERROR]

// Test for Round not accepting non-numeric input or less than 0 input [ERROR]

// Test for score multiplier not accepting non-numeric input or numeric input other than 1,2, or 3 [ERROR]

// Test for Team A points accepting numeric input greater than or equal to 0

// Test for Team B points accepting numeric input greater than or equal to 0

// Test for Round accepting numeric input greater than or equal to 0

// Test for score multiplier accepting numeric input of 1, 2, or 3

// Test for changing Team A name

// Test for changing Team B name

// Test for Team A name not accepting empty input [ERROR]

// Test for Team B name not accepting empty input [ERROR]

/* ---- Timer section ---- */

// Test for timer not accepting non-numeric input or less than 0 input [ERROR]

// Test for timer accepting numeric input greater than or equal to 0

// Test for Start button enabling timer

// Test for Stop button disabling timer

// Test for Reset button resetting timer to 0

// Test for all 3 buttons being disabled when timer input value is not numeric or less than or equal to 0 [ERROR]

/* ---- Game Controls section ---- */

// Test for Reset Game button resetting the Manage Question and Answers section, Timer section, and Active Game Info section

// Test for Reset Round button properly setting the Manage Question and Answers section, Timer section, and Active Game Info section

// Test for Next Round button properly setting the Manage Question and Answers section, Timer section, and Active Game Info section

// Test the Next Round button being disabled when round is in progress

// Test the Next Round button being disabled when game is set in Manage Question and Answers section

/* ---- Floating Button section ---- */
// Test for floating button showing correctly on host dashboard

// Test for floating button copying session ID to clipboard

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
