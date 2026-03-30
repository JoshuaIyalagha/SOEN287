/*
Create Course Page JavaScript
Written by: Joshua Iyalagha 40306001
Purpose: Handle course creation form with individual assessment categories and template support
*/

const API_BASE = 'http://localhost:3000/api';

let categoryCount = 0;
let authToken = null;

document.addEventListener('DOMContentLoaded', async function() {
    authToken = localStorage.getItem('token');

    if (!authToken) {
        window.location.href = '../login.html';
        return;
    }

    addCategory();

    const form = document.getElementById('createCourseForm');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }

    updateSubmitButtonState();
    await loadTemplates();

    // Handle template pre-load from URL params (?template=ID&clone=true)
    await handleTemplateFromURL();
});

function showError(message) {
    let errorEl = document.getElementById('createCourseError');
    if (!errorEl) {
        errorEl = document.createElement('div');
        errorEl.id = 'createCourseError';
        errorEl.style.cssText = 'color: #dc3545; margin: 10px 0; padding: 8px 12px; background: #ffe6e6; border-radius: 4px; border: 1px solid #f5c6cb; display: none;';
        const form = document.getElementById('createCourseForm');
        if (form && form.firstChild) {
            form.insertBefore(errorEl, form.firstChild);
        }
    }
    errorEl.textContent = message;
    errorEl.style.display = 'block';
    setTimeout(() => { errorEl.style.display = 'none'; }, 5000);
}

function clearError() {
    const errorEl = document.getElementById('createCourseError');
    if (errorEl) {
        errorEl.style.display = 'none';
        errorEl.textContent = '';
    }
}

function updateSubmitButtonState() {
    const submitBtn = document.querySelector('button[type="submit"]');
    if (!submitBtn) return;

    const isValid = updateTotalWeight();
    const hasRequiredFields =
        document.getElementById('courseCode')?.value.trim() &&
        document.getElementById('courseName')?.value.trim() &&
        document.getElementById('term')?.value;

    submitBtn.disabled = !isValid || !hasRequiredFields;
    submitBtn.style.opacity = submitBtn.disabled ? '0.6' : '1';
    submitBtn.style.cursor = submitBtn.disabled ? 'not-allowed' : 'pointer';
}

async function loadTemplates() {
    try {
        const response = await fetch(`${API_BASE}/templates`, {
            headers: { 'Authorization': authToken }
        });
        if (response.ok) {
            const data = await response.json();
            const select = document.getElementById('templateSelect');
            if (select) {
                data.templates.forEach(template => {
                    const option = document.createElement('option');
                    option.value = template.id;
                    option.textContent = template.name;
                    select.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error loading templates:', error);
    }
}

// Handle template loading from URL parameters
async function handleTemplateFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const templateId = urlParams.get('template');
    const isClone = urlParams.get('clone') === 'true';

    if (!templateId) return;

    console.log('Loading template from URL:', templateId, 'clone:', isClone);

    try {
        const response = await fetch(`${API_BASE}/templates`, {
            headers: { 'Authorization': authToken }
        });

        if (!response.ok) {
            console.error('Failed to fetch templates:', response.status);
            return;
        }

        const data = await response.json();
        console.log('Templates API response:', data);

        const template = data.templates.find(t => t.id == templateId);

        if (!template) {
            console.error('Template not found:', templateId);
            showError('Template not found');
            return;
        }

        console.log('Found template:', template);

        // Pre-fill course name if cloning
        if (isClone && document.getElementById('courseName')) {
            document.getElementById('courseName').value = `${template.name} (Copy)`;
        }

        // Clear existing categories
        const container = document.getElementById('assessmentCategories');
        if (container) {
            container.innerHTML = '';
        }
        categoryCount = 0;

        // Parse categories (handle both array and JSON string)
        let categories = template.categories;
        if (typeof categories === 'string') {
            try { categories = JSON.parse(categories); } catch (e) { categories = []; }
        }

        console.log('Parsed categories:', categories);

        if (categories && Array.isArray(categories) && categories.length > 0) {
            categories.forEach(cat => {
                addCategory();
                const lastCategory = document.getElementById(`category-${categoryCount}`);
                if (lastCategory) {
                    const nameInput = lastCategory.querySelector('.category-name');
                    const weightInput = lastCategory.querySelector('.category-weight');
                    // Handle both {category, weight} and {name, weight} formats
                    if (nameInput) nameInput.value = cat.category || cat.name || '';
                    if (weightInput) weightInput.value = cat.weight || 0;
                    console.log('Loaded category:', cat.category || cat.name, '=', cat.weight);
                }
            });
        } else {
            console.log('No categories found in template');
            addCategory(); // Add one empty row
        }

        // Show template preview
        const preview = document.getElementById('templatePreview');
        if (preview) {
            preview.innerHTML = `<h4>${template.name}</h4><p>${template.description || ''}</p>`;
        }

        updateTotalWeight();
        updateSubmitButtonState();

    } catch (error) {
        console.error('Error loading template from URL:', error);
        showError('Failed to load template');
    }
}

function addCategory() {
    const container = document.getElementById('assessmentCategories');
    if (!container) return;

    categoryCount++;
    const div = document.createElement('div');
    div.className = 'category-row';
    div.id = `category-${categoryCount}`;
    div.style.cssText = 'display: flex; gap: 10px; margin-bottom: 10px; align-items: center;';

    div.innerHTML = `
        <input type="text" placeholder="Assessment name (e.g., Assignment 1)" style="flex: 2; padding: 8px;" class="category-name">
        <input type="number" placeholder="Weight %" min="0" max="100" step="0.1" style="flex: 1; padding: 8px;" class="category-weight">
        <button type="button" onclick="removeCategory('category-${categoryCount}')" style="padding: 8px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">×</button>
    `;

    container.appendChild(div);

    // Real-time validation listeners
    const weightInput = div.querySelector('.category-weight');
    const nameInput = div.querySelector('.category-name');

    if (weightInput) {
        weightInput.addEventListener('input', () => {
            updateTotalWeight();
            updateSubmitButtonState();
        });
    }
    if (nameInput) {
        nameInput.addEventListener('input', updateSubmitButtonState);
    }

    updateTotalWeight();
    updateSubmitButtonState();
}

function removeCategory(id) {
    const el = document.getElementById(id);
    if (el) {
        el.remove();
        updateTotalWeight();
        updateSubmitButtonState();
    }
}

function updateTotalWeight() {
    const weights = document.querySelectorAll('.category-weight');
    let total = 0;

    weights.forEach(input => {
        const val = parseFloat(input.value);
        if (!isNaN(val)) total += val;
    });

    let totalDisplay = document.getElementById('totalWeightDisplay');
    if (!totalDisplay) {
        totalDisplay = document.createElement('p');
        totalDisplay.id = 'totalWeightDisplay';
        const container = document.getElementById('assessmentCategories');
        if (container) container.after(totalDisplay);
    }

    const isExact = Math.abs(total - 100) < 0.1;
    totalDisplay.innerHTML = `Total Weight: <strong>${total.toFixed(1)}%</strong> ${isExact ? '✓' : '❌ Must equal 100%'}`;
    totalDisplay.style.color = isExact ? '#28a745' : '#dc3545';
    totalDisplay.style.fontWeight = '500';
    totalDisplay.style.marginTop = '8px';

    return isExact;
}

function toggleTemplateName() {
    const checked = document.getElementById('createTemplate')?.checked;
    const templateNameGroup = document.getElementById('templateNameGroup');
    if (templateNameGroup) {
        templateNameGroup.style.display = checked ? 'block' : 'none';
    }
}

async function loadTemplate() {
    const templateId = document.getElementById('templateSelect')?.value;
    if (!templateId) return;

    try {
        const response = await fetch(`${API_BASE}/templates`, {
            headers: { 'Authorization': authToken }
        });
        if (response.ok) {
            const data = await response.json();
            const template = data.templates.find(t => t.id == templateId);
            if (template) {
                const container = document.getElementById('assessmentCategories');
                if (container) {
                    container.innerHTML = '';
                }
                categoryCount = 0;

                let categories = template.categories;
                if (typeof categories === 'string') {
                    try { categories = JSON.parse(categories); } catch (e) { categories = []; }
                }

                if (categories && Array.isArray(categories)) {
                    categories.forEach(cat => {
                        addCategory();
                        const lastCategory = document.getElementById(`category-${categoryCount}`);
                        if (lastCategory) {
                            const nameInput = lastCategory.querySelector('.category-name');
                            const weightInput = lastCategory.querySelector('.category-weight');
                            if (nameInput) nameInput.value = cat.category || cat.name;
                            if (weightInput) weightInput.value = cat.weight;
                        }
                    });
                }

                const preview = document.getElementById('templatePreview');
                if (preview) {
                    preview.innerHTML = `<h4>${template.name}</h4><p>${template.description || ''}</p>`;
                }
                updateTotalWeight();
                updateSubmitButtonState();
            }
        }
    } catch (error) {
        console.error('Error loading template:', error);
    }
}

async function handleSubmit(e) {
    e.preventDefault();
    clearError();

    const courseCode = document.getElementById('courseCode')?.value.trim();
    const courseName = document.getElementById('courseName')?.value.trim();

    // Handle custom term
    const termSelect = document.getElementById('term');
    const term = termSelect.value === 'custom'
        ? document.getElementById('customTerm')?.value.trim()
        : termSelect.value;

    if (!courseCode || !courseName || !term) {
        showError('Please fill in all required fields (Course Code, Name, and Term)');
        return;
    }

    if (!updateTotalWeight()) {
        showError('Total assessment weight must equal 100%');
        return;
    }

    const categories = [];
    const rows = document.querySelectorAll('.category-row');

    rows.forEach(row => {
        const name = row.querySelector('.category-name')?.value.trim();
        const weight = parseFloat(row.querySelector('.category-weight')?.value);
        if (name && !isNaN(weight)) {
            categories.push({ category: name, weight: weight, count: 1 });
        }
    });

    if (categories.length === 0) {
        showError('Please add at least one assessment category');
        return;
    }

    const courseData = {
        courseCode,
        courseName,
        term,
        description: document.getElementById('description')?.value || '',
        assessmentCategories: categories,
        createTemplate: document.getElementById('createTemplate')?.checked || false,
        templateName: document.getElementById('templateName')?.value || ''
    };

    try {
        const response = await fetch(`${API_BASE}/courses`, {
            method: 'POST',
            headers: {
                'Authorization': authToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(courseData)
        });

        const data = await response.json();
        if (response.ok) {
            const errorEl = document.getElementById('createCourseError');
            if (errorEl) {
                errorEl.style.cssText = 'color: #28a745; margin: 10px 0; padding: 8px 12px; background: #e6ffe6; border-radius: 4px; border: 1px solid #c3e6cb; display: block;';
                errorEl.textContent = `Course ${courseCode} created successfully! Redirecting...`;
            }
            setTimeout(() => { window.location.href = 'instructor-dashboard.html'; }, 1500);
        } else {
            showError(data.error || 'Failed to create course');
        }
    } catch (error) {
        console.error('Error creating course:', error);
        showError('Failed to create course. Please check your connection and try again.');
    }
}
function checkCustomTerm() {
    const termSelect = document.getElementById('term');
    const customTermInput = document.getElementById('customTerm');

    if (termSelect.value === 'custom') {
        customTermInput.style.display = 'block';
        customTermInput.required = true;
    } else {
        customTermInput.style.display = 'none';
        customTermInput.required = false;
        customTermInput.value = '';
    }
}