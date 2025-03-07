const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../app");

const connectionString = process.env.CONNECTION_STRING;

beforeAll(async () => {
    await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });
  
  afterAll(async () => {
    await mongoose.connection.close();
  });

it("POST /users/signin", async () => {
  const res = await request(app).post("/users/signin").send({
    email: "so@so.fr",
    password: "sopwd",
  });

  expect(res.statusCode).toBe(200);
  expect(res.body.result).toBe(true);
});
