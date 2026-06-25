const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const docx = require('docx');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType } = docx;

// Database Model Registry
const User = require('../models/User');
const Item = require('../models/Item');
const Report = require('../models/Report');
const Transaction = require('../models/Transaction');
const ActivityLog = require('../models/ActivityLog');
const Request = require('../models/Request'); 

// Middleware Gatekeepers
const { verifyToken, requireRole } = require('../middleware/auth');

/**
 * GET /api/admin/dashboard-aggregations
 * Synchronizes administrative metric points instantly
 */
router.get('/dashboard-aggregations', requireRole('admin'), async (req, res) => {
  try {
    const [users, listings, reports, requests] = await Promise.all([
      User.countDocuments(),
      Item.countDocuments({ status: 'active' }),
      Report.countDocuments({ status: 'pending' }),
      Request.countDocuments({ status: 'pending' }) 
    ]);
    return res.json({ users, listings, reports, requests }); 
  } catch (err) {
    return res.status(500).json({ message: "Metrics synchronization failed" });
  }
});

/**
 * GET /api/admin/export/download
 * Unified endpoint: Generates clean binary files (Excel, Word, CSV) directly on the backend
 */
router.get('/export/download', requireRole('admin'), async (req, res) => {
  const { type, format } = req.query;

  try {
    // 1. Fetch Dynamic Data Payload (matches the /reports/generate logic)
    let reportData = [];
    if (type === 'users') {
      const users = await User.find({}).sort({ createdAt: -1 });
      reportData = users.map(u => ({
        "First Name": u.firstName || 'N/A',
        "Last Name": u.lastName || 'N/A',
        "Student ID": u.schoolId || 'N/A',
        "Email Address": u.schoolMail || 'N/A',
        "Phone": u.phone || 'N/A',
        "Gender": u.gender || 'N/A',
        "Role": u.role || 'user',
        "Status": u.active ? "Active" : "Banned",
        "Verified": u.verified ? "Yes" : "No"
      }));
    } else if (type === 'listings') {
      const items = await Item.find({}).sort({ createdAt: -1 });
      reportData = items.map(i => ({
        "Item Title": i.title || 'Untitled',
        "Category": i.category || 'Uncategorized',
        "Price": i.price ? `${i.price}` : '0.00',
        "Status": i.status || 'N/A',
        "Owner ID": i.owner ? i.owner.toString() : 'N/A'
      }));
    } else if (type === 'reports') {
      const reports = await Report.find({}).sort({ createdAt: -1 });
      reportData = reports.map(r => ({
        "Report ID": r._id.toString(),
        "Target Type": r.targetType || 'N/A',
        "Target ID": r.targetId ? r.targetId.toString() : 'N/A',
        "Status": r.status || 'pending',
        "Created At": r.createdAt ? r.createdAt.toLocaleString() : 'N/A'
      }));
    } else {
      const [userCount, itemCount, reportCount, requestCount] = await Promise.all([
        User.countDocuments(),
        Item.countDocuments(),
        Report.countDocuments({ status: 'pending' }),
        Request.countDocuments({ status: 'pending' })
      ]);
      reportData = [
        { "System Metric": "Total Registered Users", "Value": String(userCount) },
        { "System Metric": "Total Marketplace Listings", "Value": String(itemCount) },
        { "System Metric": "Pending Incident Reports", "Value": String(reportCount) },
        { "System Metric": "Pending Verification Requests", "Value": String(requestCount) }
      ];
    }

    if (!reportData || reportData.length === 0) {
      return res.status(404).json({ message: "No data available to export." });
    }

    const headers = Object.keys(reportData[0]);

    // 2. Format and Dispatch File
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=${type}_report.json`);
      return res.json(reportData);
      
    } else if (format === 'csv') {
      const escapeCsv = (val) => {
        if (val === null || val === undefined) return '""';
        let strVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
        return `"${strVal.replace(/"/g, '""')}"`;
      };
      const csvLines = [
        headers.join(","),
        ...reportData.map(row => headers.map(h => escapeCsv(row[h])).join(","))
      ];
      const csvContent = csvLines.join("\n");
      
      const buffer = Buffer.concat([Buffer.from('\uFEFF', 'utf8'), Buffer.from(csvContent, 'utf8')]);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${type}_report.csv`);
      return res.send(buffer);

    } else if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Report');
      
      worksheet.columns = headers.map(h => ({ header: h, key: h, width: 20 }));
      reportData.forEach(row => worksheet.addRow(row));
      
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${type}_report.xlsx`);
      await workbook.xlsx.write(res);
      return res.end();

    } else if (format === 'word') {
      const tableRows = [
        new TableRow({
          children: headers.map(h => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })] }))
        })
      ];

      reportData.forEach(row => {
        tableRows.push(
          new TableRow({
            children: headers.map(h => new TableCell({ children: [new Paragraph(String(row[h] || 'N/A'))] }))
          })
        );
      });

      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({ children: [new TextRun({ text: `System Report: ${type.toUpperCase()}`, bold: true, size: 32 })], spacing: { after: 400 } }),
            new Paragraph({ children: [new TextRun({ text: `Generated on: ${new Date().toLocaleString()}`, italic: true })], spacing: { after: 300 } }),
            new Table({ rows: tableRows, width: { size: 100, type: WidthType.PERCENTAGE } })
          ]
        }]
      });

      const buffer = await Packer.toBuffer(doc);
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename=${type}_report.docx`);
      return res.send(buffer);
      
    } else {
      return res.status(400).json({ message: "Invalid export format specified." });
    }

  } catch (err) {
    console.error("Export generation error:", err);
    return res.status(500).json({ message: "Report compilation failed", error: err.message });
  }
});

/**
 * GET /api/admin/data/:tab
 * Fetches data collections sorted chronologically
 */
router.get('/data/:tab', requireRole('admin'), async (req, res) => {
  const { tab } = req.params;
  try {
    if (tab === 'users') {
      const users = await User.find({}, '-password -verificationCode').sort({ createdAt: -1 }); 
      return res.json(users);
    } 
    if (tab === 'listings') {
      const listings = await Item.find({}).sort({ createdAt: -1 }); 
      return res.json(listings);
    }
    if (tab === 'reports') {
      // Fetch reports and manually populate targetData for the frontend table
      const reports = await Report.find({}).lean().sort({ createdAt: -1 });
      for (let rep of reports) {
        if (rep.targetType === 'user') {
          const u = await User.findById(rep.targetId).select('firstName lastName schoolMail');
          rep.targetData = u ? `${u.firstName} ${u.lastName} (${u.schoolMail})` : 'User Not Found';
        } else if (rep.targetType === 'listing') {
          const i = await Item.findById(rep.targetId).select('title');
          rep.targetData = i ? i.title : 'Listing Not Found';
        }
      }
      return res.json(reports);
    }
    if (tab === 'requests') {
      const requests = await Request.find({}).sort({ createdAt: -1 }); 
      return res.json(requests); 
    }
    return res.json([]);
  } catch (error) {
    console.error(`Error fetching admin grid for ${tab}:`, error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

/**
 * POST /api/admin/reports/:id/resolve
 * Contextual Governance Suite: Handles Dismiss, Item Purge, or Global Account Ban
 */
router.post('/reports/:id/resolve', requireRole('admin'), async (req, res) => {
  const { actionType } = req.body; 
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Report node missing." });

    if (actionType === 'dismiss') {
      report.status = 'rejected';
    } else if (actionType === 'delete-listing') {
      report.status = 'accepted';
      if (report.targetType === 'listing') {
        await Item.findByIdAndDelete(report.targetId); 
      }
    } else if (actionType === 'ban-user-all') {
      report.status = 'accepted';
      let targetUserId = report.targetId;
      if (report.targetType === 'listing') {
        const item = await Item.findById(report.targetId);
        if (item) targetUserId = item.owner;
      }
      await User.findByIdAndUpdate(targetUserId, { active: false, isBanned: true });
      await Item.deleteMany({ owner: targetUserId });
    }

    report.resolvedBy = req.userId;
    await report.save();

    await ActivityLog.create({ 
      user: req.userId, 
      action: `resolve-report-${actionType}`, 
      details: `Processed report ${report._id} via contextual action: ${actionType}` 
    });

    return res.json({ message: `Governance action '${actionType}' completed successfully.`, report });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

/**
 * POST /api/admin/users/:id/note
 */
router.post('/users/:id/note', requireRole('admin'), async (req, res) => {
  const { adminNote } = req.body;
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { adminNote }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found." });
    return res.json({ message: "Sticky note updated successfully.", adminNote: user.adminNote });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

/**
 * POST /api/admin/requests/:id/resolve
 */
router.post('/requests/:id/resolve', requireRole('admin'), async (req, res) => {
  const { status } = req.body; 
  try {
    const ticket = await Request.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!ticket) return res.status(404).json({ message: "Assistance ticket footprint missing." });

    await ActivityLog.create({
      user: req.userId,
      action: `resolve-ticket`,
      details: `Marked support ticket ${ticket._id} from ${ticket.schoolMail} as ${status}`
    });
    return res.json({ message: `Ticket successfully closed out as ${status}.`, ticket });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

/**
 * POST /api/admin/users/:id/ban
 */
router.post('/users/:id/ban', requireRole('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User profile node missing.' });
    
    user.active = !user.active;
    await user.save();
    
    await ActivityLog.create({ 
      user: req.userId, 
      action: user.active ? 'unban-user' : 'ban-user', 
      details: `${user.active ? 'Restored' : 'Banned'} user profile state for ${user._id}` 
    });
    
    return res.json({ message: "User access status toggled successfully.", active: user.active });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

/**
 * DELETE /api/admin/users/:id
 */
router.delete('/users/:id', requireRole('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'Target identity profile node not found.' });

    await ActivityLog.create({ user: req.userId, action: 'purge-user', details: `Permanently purged user account index ${req.params.id}` });
    return res.json({ message: 'The account has been completely removed.' });
  } catch (err) {
    return res.status(500).json({ message: 'Something went wrong on our end. Please try again.' });
  }
});

// 🌟 FIXED: Pulls real dynamic collection data directly from MongoDB
router.get('/reports/generate', requireRole('admin'), async (req, res) => {
  try {
    const { type } = req.query;
    let reportData = [];

    if (type === 'users') {
      // Pull real dynamic database profiles
      const users = await User.find({}).sort({ createdAt: -1 });
      reportData = users.map(u => ({
        "First Name": u.firstName || 'N/A',
        "Last Name": u.lastName || 'N/A',
        "Student ID": u.schoolId || 'N/A',
        "Email Address": u.schoolMail || 'N/A',
        "Phone": u.phone || 'N/A',
        "Gender": u.gender || 'N/A',
        "Role": u.role || 'user',
        "Status": u.active ? "Active" : "Banned",
        "Verified": u.verified ? "Yes" : "No"
      }));

    } else if (type === 'listings') {
      // Pull real items from the marketplace
      const items = await Item.find({}).sort({ createdAt: -1 });
      reportData = items.map(i => ({
        "Item Title": i.title || 'Untitled',
        "Category": i.category || 'Uncategorized',
        "Price": i.price ? `${i.price}` : '0.00',
        "Status": i.status || 'N/A',
        "Owner ID": i.owner ? i.owner.toString() : 'N/A'
      }));

    } else if (type === 'reports') {
      // Pull real platform moderation incidents
      const reports = await Report.find({}).sort({ createdAt: -1 });
      reportData = reports.map(r => ({
        "Report ID": r._id.toString(),
        "Target Type": r.targetType || 'N/A',
        "Target ID": r.targetId ? r.targetId.toString() : 'N/A',
        "Status": r.status || 'pending',
        "Created At": r.createdAt ? r.createdAt.toLocaleString() : 'N/A'
      }));

    } else {
      // General summary system stats computed instantly
      const [userCount, itemCount, reportCount, requestCount] = await Promise.all([
        User.countDocuments(),
        Item.countDocuments(),
        Report.countDocuments({ status: 'pending' }),
        Request.countDocuments({ status: 'pending' })
      ]);

      reportData = [
        { "System Metric": "Total Registered Users", "Value": String(userCount) },
        { "System Metric": "Total Marketplace Listings", "Value": String(itemCount) },
        { "System Metric": "Pending Incident Reports", "Value": String(reportCount) },
        { "System Metric": "Pending Verification Requests", "Value": String(requestCount) }
      ];
    }

    // Explicitly return JSON arrays down the stream
    return res.status(200).json(reportData);

  } catch (error) {
    console.error("System report stream error:", error);
    return res.status(500).json({ 
      message: "Unable to create report file right now.",
      error: error.message 
    });
  }
});

module.exports = router;