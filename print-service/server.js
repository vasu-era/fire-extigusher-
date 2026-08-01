const app = require('./src/app');
const { env } = require('./src/config/env');

app.listen(env.port, () => {
  console.log(`Sticker print service running on http://localhost:${env.port}`);
});
