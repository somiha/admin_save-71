const db = require("../config/database.config");
const catModel = require("../middlewares/cat");
const { convertAndDelete } = require("../middlewares/webp_converter");
const path = require("path");
const crypto = require("../middlewares/crypto");
const adminModel = require("../middlewares/admin");
const countryModal = require("../modals/countryModal");
const adminInfoModal = require("../modals/adminInfoModal");
const helper = require("../helper/index");
const { queryAsyncWithoutValue, queryAsync } = require("../config/helper");

exports.getTask = async (req, res) => {
  const adminData = JSON.parse(
    crypto.decrypt(req.cookies.__aD || "") || "{is_logged: false}"
  );

  if (!adminData || !adminData.is_logged) {
    if (adminData.otp !== true) {
      return res.redirect("/otp");
    } else {
      return res.redirect("/login");
    }
  }

  const { error, success } = req.query;

  const admin = await adminModel.getAdminById(req, res, adminData.admin_id);
  const allPermissions = await adminModel.getAllPermissions();
  const countries = await countryModal.getAllCountries();

  // filter premissions from allPermission which has admin.permissions array
  let filteredPermissions = allPermissions;
  if (!admin.is_super_admin) {
    filteredPermissions = Object.entries(allPermissions).reduce(
      (acc, [group, permissions]) => {
        const filteredGroupPermissions = permissions.filter((permission) =>
          admin.permissions.includes(permission.permission_id)
        );
        if (filteredGroupPermissions.length > 0) {
          acc[group] = filteredGroupPermissions;
        }
        return acc;
      },
      {}
    );
  }

  const premissions = await adminModel.getAdminPremissions(
    admin.is_super_admin,
    admin.permissions
  );

  res.render("task", { premissions, admin, error, success });
};

exports.getAddTask = async (req, res) => {
  const adminInfo = JSON.parse(
    crypto.decrypt(req.cookies.__aD || "") || "{is_logged: false}"
  );
  if (!adminInfo || !adminInfo.is_logged) {
    if (adminInfo.otp !== true) {
      return res.redirect("/otp");
    } else {
      return res.redirect("/login");
    }
  }

  const admin = await adminModel.getAdminById(res, req, adminInfo.admin_id);
  const premissions = await adminModel.getAdminPremissions(
    admin.is_super_admin,
    admin.permissions
  );

  const { task_date, task, task_duration } = req.body;

  if (!task_date || !task || !task_duration) {
    return res.redirect("/task");
  }

  const checkIfTaskExists = await queryAsyncWithoutValue(
    `SELECT * FROM task_log WHERE task_date='${task_date}' AND emp_id='${adminInfo.admin_id}';`
  );

  if (checkIfTaskExists.length > 0) {
    return res.redirect("/task?error=Task already exists");
  }

  await queryAsyncWithoutValue(
    `INSERT INTO task_log (task_date, task, task_duration, emp_id) VALUES ('${task_date}', '${task}', '${task_duration}', '${adminInfo.admin_id}');`
  );

  res.redirect("/task?success=Task added successfully");
};

exports.getTasks = async (req, res) => {
  const adminInfo = JSON.parse(
    crypto.decrypt(req.cookies.__aD || "") || "{is_logged: false}"
  );

  if (!adminInfo || !adminInfo.is_logged) {
    if (adminInfo.otp !== true) {
      return res.redirect("/otp");
    } else {
      return res.redirect("/login");
    }
  }

  const admin = await adminModel.getAdminById(res, req, adminInfo.admin_id);
  const premissions = await adminModel.getAdminPremissions(
    admin.is_super_admin,
    admin.permissions
  );

  const { start_date, end_date } = req.query;

  if (!start_date || !end_date) {
    return res.redirect("/task");
  }

  const taskList = await queryAsyncWithoutValue(
    `SELECT * FROM task_log WHERE task_date BETWEEN '${start_date}' AND '${end_date}' AND emp_id='${adminInfo.admin_id}';`
  );

  return res.json(taskList);
};

exports.taskManage = async (req, res) => {
  const adminData = JSON.parse(
    crypto.decrypt(req.cookies.__aD || "") || "{is_logged: false}"
  );

  if (!adminData || !adminData.is_logged) {
    if (adminData.otp !== true) {
      return res.redirect("/otp");
    } else {
      return res.redirect("/login");
    }
  }

  const { error, success } = req.query;

  const admin = await adminModel.getAdminById(req, res, adminData.admin_id);
  const allPermissions = await adminModel.getAllPermissions();
  const countries = await countryModal.getAllCountries();

  // filter premissions from allPermission which has admin.permissions array
  let filteredPermissions = allPermissions;
  if (!admin.is_super_admin) {
    filteredPermissions = Object.entries(allPermissions).reduce(
      (acc, [group, permissions]) => {
        const filteredGroupPermissions = permissions.filter((permission) =>
          admin.permissions.includes(permission.permission_id)
        );
        if (filteredGroupPermissions.length > 0) {
          acc[group] = filteredGroupPermissions;
        }
        return acc;
      },
      {}
    );
  }

  const premissions = await adminModel.getAdminPremissions(
    admin.is_super_admin,
    admin.permissions
  );

  const is_approved = req.query.is_approved;
  const itemsPerPage = 10;

  const page = req.query.page || 1;
  const offset = (page - 1) * itemsPerPage;

  let filteredTasks = [];
  let totalTasks = 0;

  const totalPendingTasks = await queryAsyncWithoutValue(
    `SELECT COUNT(*) as total_tasks FROM task_log
    left join admin_info on task_log.emp_id = admin_info.admin_id
    WHERE admin_info.reporting_manager='${adminData.admin_id}' AND is_approved='0';
    `
  );

  const totalRejectedTasks = await queryAsyncWithoutValue(
    `SELECT COUNT(*) as total_tasks FROM task_log
    left join admin_info on task_log.emp_id = admin_info.admin_id
    WHERE admin_info.reporting_manager='${adminData.admin_id}' AND is_approved='2';
    `
  );

  if (is_approved !== undefined) {
    filteredTasks = await queryAsyncWithoutValue(
      `SELECT * FROM task_log
      left join admin_info on task_log.emp_id = admin_info.admin_id
      WHERE admin_info.reporting_manager='${adminData.admin_id}' AND is_approved='${is_approved}'
      LIMIT ${itemsPerPage} OFFSET ${offset};`
    );

    totalTasks = await queryAsyncWithoutValue(
      `SELECT COUNT(*) as total_tasks FROM task_log
    left join admin_info on task_log.emp_id = admin_info.admin_id
    WHERE admin_info.reporting_manager='${adminData.admin_id}' AND is_approved='${is_approved}';
    `
    );
  } else {
    filteredTasks = await queryAsyncWithoutValue(
      `SELECT * FROM task_log
    left join admin_info on task_log.emp_id = admin_info.admin_id
    WHERE admin_info.reporting_manager='${adminData.admin_id}'
    LIMIT ${itemsPerPage} OFFSET ${offset};`
    );

    totalTasks = await queryAsyncWithoutValue(
      `SELECT COUNT(*) as total_tasks FROM task_log
    left join admin_info on task_log.emp_id = admin_info.admin_id
    WHERE admin_info.reporting_manager='${adminData.admin_id}';
    `
    );
  }

  const totalPages = Math.ceil(totalTasks[0].total_tasks / itemsPerPage);

  res.render("taskManage", {
    premissions,
    tasks: filteredTasks,
    totalPages,
    page,
    admin,
    error,
    success,
    totalPendingTasks,
    totalRejectedTasks,
    is_approved,
  });
};

exports.updateTask = async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const { task, task_duration } = req.body;

    // Validate input
    if (!task || !task_duration) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Validate task duration format (HH:MM:SS)
    if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/.test(task_duration)) {
      return res.status(400).json({ error: "Invalid time format" });
    }

    // Check if task exists and belongs to the current user
    const existingTask = await queryAsync(
      `SELECT * FROM task_log WHERE id = ?`,
      [taskId]
    );

    if (!existingTask || existingTask.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Update the task
    await queryAsync(
      `UPDATE task_log 
       SET task = ?, task_duration = ?, is_approved = 0
       WHERE id = ?`,
      [task, task_duration, taskId]
    );

    // Get the updated task
    const updatedTask = await queryAsync(
      `SELECT * FROM task_log WHERE id = ?`,
      [taskId]
    );

    res.json({
      success: true,
      task: updatedTask[0],
      message: "Task updated successfully",
    });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Employee Salary Management Controller
exports.employeeSalaryManage = async (req, res) => {
  const adminData = JSON.parse(
    crypto.decrypt(req.cookies.__aD || "") || "{is_logged: false}"
  );

  if (!adminData || !adminData.is_logged) {
    if (adminData.otp !== true) {
      return res.redirect("/otp");
    } else {
      return res.redirect("/login");
    }
  }

  const { error, success } = req.query;

  const admin = await adminModel.getAdminById(req, res, adminData.admin_id);
  const allPermissions = await adminModel.getAllPermissions();
  const countries = await countryModal.getAllCountries();

  // Filter permissions
  let filteredPermissions = allPermissions;
  if (!admin.is_super_admin) {
    filteredPermissions = Object.entries(allPermissions).reduce(
      (acc, [group, permissions]) => {
        const filteredGroupPermissions = permissions.filter((permission) =>
          admin.permissions.includes(permission.permission_id)
        );
        if (filteredGroupPermissions.length > 0) {
          acc[group] = filteredGroupPermissions;
        }
        return acc;
      },
      {}
    );
  }

  const premissions = await adminModel.getAdminPremissions(
    admin.is_super_admin,
    admin.permissions
  );

  // Check if user has permission to view salary management
  // if (
  //   !admin.is_super_admin &&
  //   !admin.permissions.includes("view_salary_management")
  // ) {
  //   return res.status(403).render("403", { admin, premissions });
  // }

  const itemsPerPage = 10;
  const page = req.query.page || 1;
  const offset = (page - 1) * itemsPerPage;

  // Get employees under this manager
  const employees = await queryAsyncWithoutValue(
    `SELECT admin_id, admin_name, admin_email FROM admin_info 
     WHERE reporting_manager='${adminData.admin_id}'
     LIMIT ${itemsPerPage} OFFSET ${offset};`
  );

  const totalEmployees = await queryAsyncWithoutValue(
    `SELECT COUNT(*) as total FROM admin_info 
     WHERE reporting_manager='${adminData.admin_id}';`
  );

  const totalPages = Math.ceil(totalEmployees[0].total / itemsPerPage);

  // If employee_id and date range provided, get salary data from task_log
  let salaryData = [];
  let salarySummary = {};
  if (req.query.employee_id && req.query.from_date && req.query.to_date) {
    salaryData = await queryAsyncWithoutValue(
      `SELECT emp_id, salary, task_date, task_duration
     FROM task_log 
     WHERE emp_id='${req.query.employee_id}' 
     AND task_date BETWEEN '${req.query.from_date}' AND '${req.query.to_date}'
     AND is_approved = 1
     ORDER BY task_date DESC;`
    );

    // Calculate salary summary (total, average, etc.)
    if (salaryData.length > 0) {
      const totalSalary = salaryData.reduce(
        (sum, record) => sum + parseFloat(record.salary),
        0
      );
      const averageSalary = totalSalary / salaryData.length;
      const minSalary = Math.min(
        ...salaryData.map((record) => parseFloat(record.salary))
      );
      const maxSalary = Math.max(
        ...salaryData.map((record) => parseFloat(record.salary))
      );

      salarySummary = {
        totalSalary: totalSalary.toFixed(2),
        averageSalary: averageSalary.toFixed(2),
        minSalary: minSalary.toFixed(2),
        maxSalary: maxSalary.toFixed(2),
        paymentCount: salaryData.length,
      };
    }
  }

  res.render("employeeList", {
    premissions,
    employees,
    totalPages,
    page,
    admin,
    error,
    success,
    salaryData,
    salarySummary,
    selectedEmployee: req.query.employee_id || "",
    fromDate: req.query.from_date || "",
    toDate: req.query.to_date || "",
    totalEmployees,
  });
};

exports.getMySalary = async (req, res) => {
  const adminData = JSON.parse(
    crypto.decrypt(req.cookies.__aD || "") || "{is_logged: false}"
  );

  if (!adminData || !adminData.is_logged) {
    return adminData.otp !== true
      ? res.redirect("/otp")
      : res.redirect("/login");
  }

  const { error, success } = req.query;
  const admin = await adminModel.getAdminById(req, res, adminData.admin_id);
  const allPermissions = await adminModel.getAllPermissions();
  const countries = await countryModal.getAllCountries();

  // filter premissions from allPermission which has admin.permissions array
  let filteredPermissions = allPermissions;
  if (!admin.is_super_admin) {
    filteredPermissions = Object.entries(allPermissions).reduce(
      (acc, [group, permissions]) => {
        const filteredGroupPermissions = permissions.filter((permission) =>
          admin.permissions.includes(permission.permission_id)
        );
        if (filteredGroupPermissions.length > 0) {
          acc[group] = filteredGroupPermissions;
        }
        return acc;
      },
      {}
    );
  }

  const premissions = await adminModel.getAdminPremissions(
    admin.is_super_admin,
    admin.permissions
  );
  const { from_date, to_date } = req.query;
  const emp_id = adminData.admin_id;

  try {
    let query = `
      SELECT 
        task_date,
        task_duration,
        salary
      FROM task_log
      WHERE emp_id = ?
    `;

    let params = [emp_id];

    if (from_date && to_date) {
      query += " AND task_date BETWEEN ? AND ?";
      params.push(from_date, to_date);
    }

    query += " ORDER BY task_date DESC";

    const salaryData = await queryAsync(query, params);

    let totalSalary = 0;
    let totalHours = 0;
    let totalMinutes = 0;

    salaryData.forEach((record) => {
      totalSalary += parseFloat(record.salary) || 0;

      const duration = record.task_duration || "";
      const hoursMatch = duration.match(/(\d+)h/);
      const minsMatch = duration.match(/(\d+)m/);

      const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
      const mins = minsMatch ? parseInt(minsMatch[1]) : 0;

      totalHours += hours;
      totalMinutes += mins;
    });

    totalHours += Math.floor(totalMinutes / 60);
    totalMinutes = totalMinutes % 60;

    res.render("mySalary", {
      salaryData,
      totals: {
        salary: totalSalary.toFixed(2),
        hours: `${totalHours}h ${totalMinutes}m`,
        count: salaryData.length,
      },

      fromDate: req.query.from_date || "",
      toDate: req.query.to_date || "",
      premissions,
      admin,
      countries,
      error,
      success,
    });
  } catch (err) {
    console.error("Salary error:", err);
    res.redirect("/my-salary?error=Could not load salary data");
  }
};
