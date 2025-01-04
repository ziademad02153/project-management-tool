const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Team = require('../models/Team');
const PDFDocument = require('pdfkit-table');

// Get statistics for tasks/projects
router.get('/:type', auth, async (req, res) => {
  try {
    const { type } = req.params;
    const { period = 'week' } = req.query;

    let startDate = new Date();
    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    let stats = {};

    if (type === 'tasks') {
      // Get task statistics
      const tasks = await Task.find({
        user: req.user.id,
        createdAt: { $gte: startDate }
      });

      const statusDistribution = [
        { name: 'مكتملة', value: tasks.filter(t => t.status === 'completed').length },
        { name: 'قيد التنفيذ', value: tasks.filter(t => t.status === 'in-progress').length },
        { name: 'معلقة', value: tasks.filter(t => t.status === 'pending').length }
      ];

      // Get timeline data
      const timelineData = [];
      let currentDate = new Date(startDate);
      while (currentDate <= new Date()) {
        const dayTasks = tasks.filter(t => {
          const taskDate = new Date(t.createdAt);
          return taskDate.toDateString() === currentDate.toDateString();
        });

        timelineData.push({
          name: currentDate.toLocaleDateString('ar-EG'),
          completed: dayTasks.filter(t => t.status === 'completed').length,
          pending: dayTasks.filter(t => t.status !== 'completed').length
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      stats = {
        statusDistribution,
        timelineData,
        summary: [
          {
            label: 'إجمالي المهام',
            value: tasks.length,
            change: ((tasks.length / (await Task.countDocuments({ user: req.user.id }))) * 100 - 100).toFixed(1)
          },
          {
            label: 'المهام المكتملة',
            value: tasks.filter(t => t.status === 'completed').length,
            change: 0
          },
          {
            label: 'متوسط وقت الإنجاز',
            value: `${Math.round(tasks.reduce((acc, task) => {
              if (task.status === 'completed') {
                return acc + (new Date(task.completedAt) - new Date(task.createdAt)) / (1000 * 60 * 60 * 24);
              }
              return acc;
            }, 0) / tasks.filter(t => t.status === 'completed').length)} يوم`,
            change: 0
          }
        ]
      };
    } else if (type === 'projects') {
      // Get project statistics
      const projects = await Project.find({
        user: req.user.id,
        createdAt: { $gte: startDate }
      }).populate('tasks');

      const statusDistribution = [
        {
          name: 'مكتملة',
          value: projects.filter(p => 
            p.tasks.length > 0 && 
            p.tasks.every(t => t.status === 'completed')
          ).length
        },
        {
          name: 'قيد التنفيذ',
          value: projects.filter(p => 
            p.tasks.length > 0 && 
            p.tasks.some(t => t.status === 'completed') &&
            p.tasks.some(t => t.status !== 'completed')
          ).length
        },
        {
          name: 'لم تبدأ',
          value: projects.filter(p => 
            p.tasks.length === 0 || 
            p.tasks.every(t => t.status === 'pending')
          ).length
        }
      ];

      stats = {
        statusDistribution,
        timelineData: projects.map(p => ({
          name: p.name,
          completed: p.tasks.filter(t => t.status === 'completed').length,
          pending: p.tasks.filter(t => t.status !== 'completed').length
        })),
        summary: [
          {
            label: 'إجمالي المشاريع',
            value: projects.length,
            change: ((projects.length / (await Project.countDocuments({ user: req.user.id }))) * 100 - 100).toFixed(1)
          },
          {
            label: 'المشاريع المكتملة',
            value: projects.filter(p => 
              p.tasks.length > 0 && 
              p.tasks.every(t => t.status === 'completed')
            ).length,
            change: 0
          },
          {
            label: 'متوسط المهام لكل مشروع',
            value: Math.round(projects.reduce((acc, p) => acc + p.tasks.length, 0) / projects.length),
            change: 0
          }
        ]
      };
    }

    res.json(stats);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Download report as PDF
router.get('/download/:type', auth, async (req, res) => {
  try {
    const { type } = req.params;
    const { period = 'week' } = req.query;

    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=report-${type}-${period}.pdf`);

    // Pipe the PDF document to the response
    doc.pipe(res);

    // Add content to PDF
    doc.fontSize(25).text('تقرير الأداء', { align: 'right' });
    doc.moveDown();

    if (type === 'tasks') {
      const tasks = await Task.find({
        user: req.user.id
      }).populate('project');

      const table = {
        title: 'المهام',
        headers: ['المهمة', 'المشروع', 'الحالة', 'تاريخ الإنشاء'],
        rows: tasks.map(task => [
          task.title,
          task.project?.name || '-',
          task.status === 'completed' ? 'مكتملة' : task.status === 'in-progress' ? 'قيد التنفيذ' : 'معلقة',
          new Date(task.createdAt).toLocaleDateString('ar-EG')
        ])
      };

      await doc.table(table, {
        prepareHeader: () => doc.font('Helvetica-Bold').fontSize(10),
        prepareRow: () => doc.font('Helvetica').fontSize(10)
      });
    } else if (type === 'projects') {
      const projects = await Project.find({
        user: req.user.id
      }).populate('tasks');

      const table = {
        title: 'المشاريع',
        headers: ['المشروع', 'عدد المهام', 'المهام المكتملة', 'نسبة الإنجاز'],
        rows: projects.map(project => [
          project.name,
          project.tasks.length,
          project.tasks.filter(t => t.status === 'completed').length,
          `${Math.round((project.tasks.filter(t => t.status === 'completed').length / project.tasks.length) * 100)}%`
        ])
      };

      await doc.table(table, {
        prepareHeader: () => doc.font('Helvetica-Bold').fontSize(10),
        prepareRow: () => doc.font('Helvetica').fontSize(10)
      });
    }

    // Finalize PDF file
    doc.end();
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;
