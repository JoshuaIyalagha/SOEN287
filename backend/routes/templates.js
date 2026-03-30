/*
Written by Joshua Iyalagha 40306001
 */
// backend/routes/templates.js
const fs = require('fs');
const path = require('path');

const TEMPLATES_FILE = path.join(__dirname, '..', 'data', 'templates.json');

function readTemplates() {
    const data = fs.readFileSync(TEMPLATES_FILE, 'utf8');
    return JSON.parse(data);
}

function writeTemplates(data) {
    fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(data, null, 2));
}

function verifyToken(token) {
    try {
        const decoded = Buffer.from(token, 'base64').toString();
        return JSON.parse(decoded);
    } catch (error) {
        return null;
    }
}

function getTemplates(req, res, token) {
    const user = verifyToken(token);

    if (!user) {
        sendJSON(res, 401, { error: 'Invalid token' });
        return;
    }

    const templatesData = readTemplates();
    sendJSON(res, 200, { templates: templatesData.templates });
}

function createTemplate(req, res, token, body) {
    const user = verifyToken(token);

    if (!user || user.role !== 'instructor') {
        sendJSON(res, 403, { error: 'Only instructors can create templates' });
        return;
    }

    const { name, description, categories } = body;

    if (!name) {
        sendJSON(res, 400, { error: 'Template name is required' });
        return;
    }

    const templatesData = readTemplates();

    const newId = templatesData.templates.length > 0
        ? Math.max(...templatesData.templates.map(t => t.id)) + 1
        : 101;

    const newTemplate = {
        id: newId,
        name: name,
        description: description || '',
        categories: categories || []
    };

    templatesData.templates.push(newTemplate);
    writeTemplates(templatesData);

    sendJSON(res, 201, {
        success: true,
        message: 'Template created successfully',
        template: newTemplate
    });
}

function sendJSON(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}

module.exports = { getTemplates, createTemplate };