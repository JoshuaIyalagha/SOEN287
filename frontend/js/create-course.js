/*
Create Course Page JavaScript
Written by: Joshua Iyalagha 40306001
Purpose: Handle course creation form and assessment weightings
*/

let categoryCount = 0;

document.addEventListener('DOMContentLoaded', function() {
    console.log('Create course page loaded');
    // Add first category by default
    addCategory();

    // Set up form submission
    document.getElementById('createCourseForm').addEventListener('submit', handleSubmit);
});

// Add a new assessment category row
function addCategory() {
    const container = document.getElementById('assessmentCategories');
    categoryCount++;

    const div = document.createElement('div');
    div.className = 'category-row';
    div.id = `category-${categoryCount}`;
    div.style.cssText = 'display: flex; gap: 10px; margin-bottom: 10px; align-items: center;';

    div.innerHTML = `
        <input type="text" placeholder="Category name (e.g., Assignments)" style="flex: 2; padding: 8px;" class="category-name">
        <input type="number" placeholder="Weight %" min="0" max="100" style="flex: 1; padding: 8px;" class="category-weight">
        <input type="number" placeholder="Number of assessments" min="1" style="flex: 1; padding: 8px;" class="category-count">
        <button type="button" onclick="removeCategory('category-${categoryCount}')" style="padding: 8px 12px; background: #dc3545; color: white; border: none; border-radius: 4px;">×</button>
    `;

    container.appendChild(div);
    updateTotalWeight();
}

// Remove a category row
function removeCategory(id) {
    document.getElementById(id).remove();
    updateTotalWeight();
}

// Update total weight display
function updateTotalWeight() {
    const weights = document.querySelectorAll('.category-weight');
    let total = 0;

    weights.forEach(input => {
        const val = parseFloat(input.value);
        if (!isNaN(val)) {
            total += val;
        }
    });

    // Create or update total display
    let totalDisplay = document.getElementById('totalWeightDisplay');
    if (!totalDisplay) {
        totalDisplay = document.createElement('p');
        totalDisplay.id = 'totalWeightDisplay';
        document.getElementById('assessmentCategories').after(totalDisplay);
    }

    totalDisplay.innerHTML = `Total Weight: <strong>${total}%</strong> ${total === 100 ? '✓' : '❌ Must equal 100%'}`;
    totalDisplay.style.color = total === 100 ? 'green' : 'red';

    return total === 100;
}

// Toggle template name field
function toggleTemplateName() {
    const checked = document.getElementById('createTemplate').checked;
    document.getElementById('templateNameGroup').style.display = checked ? 'block' : 'none';
}

// Load template data
function loadTemplate() {
    const templateId = document.getElementById('templateSelect').value;
    if (!templateId) return;

    // Find template from mock data
    const template = instructorMockData.templates.find(t => t.id == templateId);
    if (!template) return;

    // Clear existing categories
    const container = document.getElementById('assessmentCategories');
    container.innerHTML = '';
    categoryCount = 0;

    // Add template categories
    template.categories.forEach(cat => {
        addCategory();
        const lastCategory = document.getElementById(`category-${categoryCount}`);
        lastCategory.querySelector('.category-name').value = cat.category;
        lastCategory.querySelector('.category-weight').value = cat.weight;
        lastCategory.querySelector('.category-count').value = cat.count || 1;
    });

    // Show template preview
    const preview = document.getElementById('templatePreview');
    preview.innerHTML = `
        <h4>${template.name}</h4>
        <p>${template.description}</p>
    `;

    updateTotalWeight();
}

// Handle form submission
function handleSubmit(e) {
    e.preventDefault();

    // Basic validation
    const courseCode = document.getElementById('courseCode').value;
    const courseName = document.getElementById('courseName').value;
    const term = document.getElementById('term').value;

    if (!courseCode || !courseName || !term) {
        alert('Please fill in all required fields');
        return;
    }

    if (!updateTotalWeight()) {
        alert('Total weight must equal 100%');
        return;
    }

    // Collect categories
    const categories = [];
    const rows = document.querySelectorAll('.category-row');

    rows.forEach(row => {
        const name = row.querySelector('.category-name').value;
        const weight = parseFloat(row.querySelector('.category-weight').value);
        const count = parseInt(row.querySelector('.category-count').value);

        if (name && !isNaN(weight) && !isNaN(count)) {
            categories.push({ category: name, weight: weight, count: count });
        }
    });

    // Create course object
    const newCourse = {
        id: instructorMockData.courses.length + 1,
        code: courseCode,
        name: courseName,
        instructor: "Dr. Sarah Johnson", // Hardcoded for demo
        term: term,
        enabled: true,
        students: 0,
        description: document.getElementById('description').value,
        assessmentCategories: categories
    };

    console.log('Course created:', newCourse);

    // Save as template if checked
    if (document.getElementById('createTemplate').checked) {
        const templateName = document.getElementById('templateName').value || `${courseCode} Template`;
        const newTemplate = {
            id: instructorMockData.templates.length + 101,
            name: templateName,
            description: `Template for ${courseName}`,
            categories: categories
        };
        console.log('Template saved:', newTemplate);
    }

    // Show success message
    alert(`Course ${courseCode} created successfully! In deliverable 2, this would be saved to the database.`);

    // Redirect back to dashboard
    window.location.href = 'instructor-dashboard.html';
}