import { server } from './index.js';
// Start the server
if (import.meta.url === `file://${process.argv[1]}`) {
  const PORT = process.env.PORT || 4000;
  server.listen(PORT, () => {
    // console.log(`Server is running on port ${PORT}`);
  });
}
