const request = require("supertest");
const app = require("../app");

describe("Test the root path", () => {
  test("should return the challenge with the given id", (done) => {
    const idChallenge = "67c985d2d9437c138e7b22fb";
    request(app)
      .get(`/challenges/${idChallenge}`)
      .then((response) => {
        expect(response.statusCode).toBe(200);
       // console.log(response.challenge);
        expect(response.body.challenge).toHaveProperty("title", "challenge1");
        expect(response.body.challenge).toHaveProperty("_id", "67c985d2d9437c138e7b22fb");
        expect(response.body.challenge).toHaveProperty(
          "title",
          "description",
          "books"
        );
        done();
      });
  });

  test("should return 404 if challenge is not found", async () => {
    const nonExistentIdChallenge = "67c985d2d9437c138e7b22fa";

    const response = await request(app).get(`/challenges/${nonExistentIdChallenge}`);
    //console.log(response);
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("result", false);
    expect(response.body).toHaveProperty("message", "Challenge not found");
  });
});
