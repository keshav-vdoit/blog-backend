import { Hono } from "hono";
import { PrismaClient } from "@prisma/client";
import { sign, verify } from "hono/jwt";
import { password } from "bun";
const prisma = new PrismaClient();

export const authRouter = new Hono<{
  Bindings: {
    JWT_SECRET: string;
  };
  Variables: {
    userId: string;
  };
}>();

authRouter.post("/signup", async (c) => {
  const body = await c.req.json();

  const passwordHash = await password.hash(body.password);

  try {
    const newUser = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        passwordHash: passwordHash,
      },
    });

    return c.json({
      message: `user ${newUser.name} create successfully`,
    });
  } catch (error) {
    console.log(error);
  }
});


authRouter.post("/signin", async (c) => {
  const body = await c.req.json();

  const user = await prisma.user.findUnique({
    where: {
      email: body.email,
    },
  });
  if (!user) {
    return c.json({ message: "User not found" });
  } else {
    const passwordMatch = await password.verify(
      body.password,
      user.passwordHash
    );
    if (!passwordMatch) {
      return c.json({ message: "Incorrect password" });
    }
  }
  const token = await sign(
    { exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, email: user.email },
    process.env.JWT_SECRET
  );
  return c.json({ token: token });
});

authRouter.use("/*", async (c, next) => {
  try {
    const header = c.req.header("authorization") || "";
    const token = header && header.split(" ")[1];
    const user = await verify(token, c.env.JWT_SECRET);
    if (user && typeof user.email === "string") {
      c.set("userId", user.email);
      return next();
    } else {
      c.status(403);
      return c.json({ error: "Unauthorized " });
    }
  } catch (e) {
    c.status(403);
    console.log(e);
    return c.json({
      error: "Credentials failedd",
    });
  }
});

authRouter.get("/deleteAll", async (c) => {
  await prisma.user.deleteMany({});
  return c.json({ message: "All users deleted" });
});
authRouter.get("/getAll", async (c) => {
  const users = await prisma.user.findMany();
  return c.json({ message: users });
});
