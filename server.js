import { createServer } from 'http';
import { handler } from './dist/server/entry.mjs';

const port = process.env.PORT || 8080;
const server = createServer(handler);

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
