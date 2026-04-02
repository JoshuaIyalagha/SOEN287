const API_BASE = 'http://localhost:3000/api';

let authToken = null;
let studentId = null;
let enrolledCourses = null;

document.addEventListener('DOMContentLoaded', function() {

    authToken = localStorage.getItem('token');
    if (!authToken) {
        window.location.href = '../login.html';
        return;
    }
    const decoded = JSON.parse(atob(authToken));
    studentId = decoded.id;

  loadAssessments();
});

parameters = new URLSearchParams(document.location.search);
const activeCourseId = parameters.get('active');

const assessmentDetails = document.getElementById('assessmentDetails');

async function loadAssessments() {
  let html = '';
  let assessments;

  enrolledCourses = await getEnrolled(studentId);
  for(const course of enrolledCourses) {
    if(activeCourseId == course.id) {
      html += '<details open=true>';
    }
    else {
      html += '<details>';
    }

    html += `
      <summary class="course-header">
        <h2>${course.name}</h2> </summary>
      `;

    categories = await getCategories(course.id);
    assessments = await getAssessments(course.id);

    for(const category of categories) {

      html += loadCategory(category, assessments);
    }

    html += `</details>`;
  }
  assessmentDetails.innerHTML = html;
}

async function getEnrolled(studentId) {
    const response = await fetch(`${API_BASE}/enrollment/courses/${studentId}`, {
        method: 'GET',
        headers: { 'Authorization': authToken },
    });

    const data = await response.json();

    return data.courses;
}
async function getAssessments(courseId) {
  const response = await fetch(`${API_BASE}/assessments/${courseId}`, {
      method: 'GET',
      headers: { 'Authorization': authToken },
  });

  const data = await response.json();
  
  return data.assessments;
}

async function getCategories(courseId) {
  const response = await fetch(`${API_BASE}/assessments/categories/${courseId}`, {
      method: 'GET',
      headers: { 'Authorization': authToken },
  });
  
  const data = await response.json();

  return data.categories;
}

function loadAssessment(assessment) {
      let html = `
          <div class="assessment">
          <span class="assessment-title">${assessment.name}</span>
          <span class="assessment-grade">na/${assessment.total_marks}</span>
          <span class="assessment-type"> Type: ${assessment.type}</span>
          <span class="assessment-status"> Status: N/A</span>
          </div>
      `;
      return html;
}

function loadCategory(category, assessments) {
    console.log(category);
    console.log(assessments);

      const categoryAssessments = assessments.filter( function(assessment) {
        return assessment.category_id === category.id;
      });

      let html = `<div class="assessment-group">
                <h3>${category.category_name}</h3>
      `;


    if(categoryAssessments.length === 0) {
      html +=`
      <div class="assessment">
        <span>No data.</span>;
      </div>
      `;
    }

    for(const assessment of categoryAssessments) {
      
      html += loadAssessment(assessment);

    }



      html += `</div>`;

      return html;

}