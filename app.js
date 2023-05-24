const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message};`);
    process.exit(1);
  }
};

initializeDBAndServer();

app.get("/todos/", async (request, response) => {
  let data = "";
  let getQueryDetails = "";
  const { status, priority, search_q = "" } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getQueryDetails = `
            SELECT * FROM todo WHERE 
            priority = '${priority}'
            AND status = '${status}'
            AND todo LIKE '%{search_q}%';`;
      break;
    case hasPriorityProperty(request, query):
      getQueryDetails = `
            SELECT * FROM todo WHERE
            priority = '${priority}'
            AND todo LIKE '%{search_q}%';`;
      break;
    case hasStatusProperty(request.query):
      getQueryDetails = `
            SELECT * FROM todo WHERE
            status = '${status}'
            AND todo LIKE '%{search_q}%';`;
      break;
    default:
      getQueryDetails = `
            SELECT * FROM todo WHERE 
            todo LIKE '%{search_q}%';`;
      break;
  }
  data = await db.all(getQueryDetails);
  response.send(data);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodo = `
    SELECT * FROM todo
    WHERE id = '${todoId}';`;
  const todoResponse = await db.get(getTodo);
  response.send(todoResponse);
});

app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status } = todoDetails;
  const putTodoQuery = `
    INSERT INTO todo (id, todo, priority, status)
    VALUES
     (
    ${id},
    '${todo}',
    '${priority}',
    '${status}'
    );`;

  const todoResponse = await db.run(putTodoQuery);
  const todoId = todoResponse.lastID;
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const todoDetails = request.body;
  const { status, priority, todo } = todoDetails;
  const updateTodoQuery = `
    UPDATE todo SET
    status = '${status}',
    priority = '${priority}',
    todo = '${todo}'
    WHERE id = ${todoId};`;

  await db.run(updateTodoQuery);
  response.send("Status Updated");
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const removeTodoQuery = `
    DELETE FROM todo
    WHERE id = ${todoId};`;
  await db.run(removeTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
