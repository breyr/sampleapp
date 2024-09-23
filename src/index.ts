import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import express, { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import path from 'path';

interface CustomJwtPayload extends JwtPayload {
  userId: string;
}
interface AuthenticatedRequest extends Request {
  user?: CustomJwtPayload;
}

dotenv.config();
const app = express();
const prisma = new PrismaClient();
const basePath = process.env.BASE_PATH || '/';
const getFullPath = (path: string) => {
  if (basePath === '/') {
    return path;
  }
  return `${basePath}${path}`;
};

app.use(express.json());
// serve static files
app.use(basePath, express.static(path.join(__dirname, '../public')))
// set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// middleware
const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user as CustomJwtPayload;
    next();
  });
}

// endpoints
// register user
app.post(getFullPath('/register'), async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, password: hashedPassword },
    });
    res.json(user);
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).send('Failed to register user');
  }
});

// login user
app.post(getFullPath('/login'), async (req: AuthenticatedRequest, res) => {
  try {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).send('Invalid credentials');
    }
    const token = jwt.sign({ userId: user.id }, process.env.ACCESS_TOKEN_SECRET!);
    res.json({ token });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).send('Failed to log in user');
  }
});

// create a task
app.post(getFullPath('/dashboard/tasks'), authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title } = req.body;
    const task = await prisma.task.create({
      data: { title, userId: Number(req.user!.userId) },
    });
    res.json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).send('Failed to create task');
  }
});

// mark task as completed
app.post(getFullPath('/dashboard/tasks/:id/complete'), authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const taskId = parseInt(req.params.id, 10);
  try {
    const task = await prisma.task.update({
      where: { id: taskId },
      data: { completed: true },
    });
    res.json(task);
  } catch (error) {
    console.error('Error completing task:', error);
    res.status(500).send('Failed to complete task');
  }
});

// delete task
app.delete(getFullPath('/dashboard/tasks/:id'), authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const taskId = parseInt(req.params.id, 10);
  try {
    await prisma.task.delete({
      where: { id: taskId },
    });
    res.sendStatus(204);
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).send('Failed to delete task');
  }
});

// get tasks
app.get(getFullPath('/dashboard/tasks'), authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tasks = await prisma.task.findMany({ where: { userId: Number(req.user!.userId) } });
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).send('Failed to fetch tasks');
  }
});

// render index view
app.get(basePath, (req, res) => {
  res.render('index', { basePath });
});

// render the dashboard view
app.get(getFullPath('/dashboard'), (req, res) => {
  res.render('dashboard', { basePath });
});

// start application
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} with base path ${basePath}`)
});