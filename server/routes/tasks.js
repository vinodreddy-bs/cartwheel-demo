const express = require('express');
const { nextId } = require('../store');

const PRIORITIES = ['low', 'medium', 'high'];
const router = express.Router();

function checkAssignee(store, assignedTo) {
  if (assignedTo === undefined || assignedTo === null) return { id: null };
  if (!/^\d+$/.test(String(assignedTo))) return { error: 'assignedTo must be a valid user ID' };
  const id = Number(assignedTo);
  if (!store.users.some((u) => u.id === id)) return { error: 'assignedTo user does not exist' };
  return { id };
}

router.get('/', (req, res) => {
  const { tasks } = req.app.locals.store;
  let list = tasks;
  if (req.query.completed !== undefined) list = list.filter((t) => t.completed === (req.query.completed === 'true'));
  if (req.query.priority) list = list.filter((t) => t.priority === req.query.priority);
  res.json({ tasks: list, total: list.length, completed: tasks.filter((t) => t.completed).length, pending: tasks.filter((t) => !t.completed).length });
});

router.post('/', (req, res) => {
  const { store, clock } = req.app.locals;
  const { title, priority = 'medium', assignedTo } = req.body || {};
  if (!title || !String(title).trim()) return res.status(422).json({ error: 'Title is required' });
  if (!PRIORITIES.includes(priority)) return res.status(422).json({ error: 'Invalid priority value', allowed: PRIORITIES });
  const assignee = checkAssignee(store, assignedTo);
  if (assignee.error) return res.status(422).json({ error: assignee.error });
  const task = { id: nextId(store, 'task'), title: String(title).trim(), completed: false, priority, assignedTo: assignee.id, createdAt: clock.now().toISOString() };
  store.tasks.push(task);
  res.status(201).json({ message: 'Task created', task });
});

router.put('/:id', (req, res) => {
  const { store } = req.app.locals;
  const task = store.tasks.find((t) => String(t.id) === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  const { title, completed, priority, assignedTo } = req.body || {};
  if (priority !== undefined && !PRIORITIES.includes(priority)) return res.status(422).json({ error: 'Invalid priority value', allowed: PRIORITIES });
  if (completed !== undefined && typeof completed !== 'boolean') return res.status(422).json({ error: 'completed must be true or false' });
  const assignee = assignedTo === undefined ? null : checkAssignee(store, assignedTo);
  if (assignee && assignee.error) return res.status(422).json({ error: assignee.error });
  if (title !== undefined && String(title).trim()) task.title = String(title).trim();
  if (completed !== undefined) task.completed = completed;
  if (priority !== undefined) task.priority = priority;
  if (assignee) task.assignedTo = assignee.id;
  res.json({ message: 'Task updated', task });
});

module.exports = router;
