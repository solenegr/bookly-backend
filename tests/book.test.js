const request = require("supertest");
const app = require("../app");

describe("Test the root path", () => {
  test("should return the book with the given ISBN", (done) => {
    const isbn = "978-2-330-02430-7";
    request(app)
      .get(`/books/isbn/${isbn}`)
      .then((response) => {
        expect(response.statusCode).toBe(200);
        console.log(response.body.book);
        expect(response.body.book).toHaveProperty("isbn", "978-2-330-02430-7");
        expect(response.body.book).toHaveProperty(
          "title",
          "Silo (French Edition)"
        );
        done();
      });
  });

  test("should return 404 if book is not found", async () => {
    const nonExistentIsbn = "97800000000000";

    const response = await request(app).get(`/books/isbn/${nonExistentIsbn}`);
    console.log(response);
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("result", false);
    expect(response.body).toHaveProperty("error", "Book not found");
  });
});
