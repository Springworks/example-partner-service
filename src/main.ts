import { createServer } from './service-provider';

/*tslint:disable:no-console */
createServer()
  .then(async server => {
    await server.start();
    console.log('Server running at:', server.info.uri);
  })
  .catch(err => {
    console.log(err);
    process.exit(1);
  });
