
const request = require('supertest');
const app = require('../app');
// module.exports = {
//     mongoose,
//     connect: () => {
//       mongoose.Promise = Promise;
//       mongoose.connect(config.database[process.env.CONNECTION_STRING]);
//     },
//     disconnect: done => {
//       mongoose.disconnect(done);
//     }
//   };

it('GET /challenges', async () => {
 const res = await request(app).get('/challenges');

 expect(res.statusCode).toBe(200);
//  expect(res.body.stock).toEqual(['iPhone', 'iPad', 'iPod']);
});