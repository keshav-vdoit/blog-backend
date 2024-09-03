import { Hono } from "hono";
import { authRouter } from "./routes/auth.route";

const app = new Hono();

app.get("/", (c) => {
  console.log("Starting on server port 3000");
  return c.json({ message: "Hello Hono!" });
});
app.get("/working",(c)=>{
  return c.redirect("/",301)
})

app.route("/auth", authRouter);

export default app;