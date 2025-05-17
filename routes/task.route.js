const express = require("express");
const {
  getTask,
  getAddTask,
  getTasks,
  taskManage,
  updateTask,
  employeeSalaryManage,
  getMySalary,
} = require("../controllers/task.controller");
const router = express.Router();

router.get("/task", getTask);
router.post("/add-task", getAddTask);
router.get("/api/tasks", getTasks);
router.get("/task-manage", taskManage);
router.post("/update-task/:taskId", updateTask);
router.get("/employee-list", employeeSalaryManage);
router.get("/my-salary", getMySalary);

module.exports = router;
