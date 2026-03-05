document.addEventListener('DOMContentLoaded', function() {
  loadAssessments();
});

parameters = new URLSearchParams(document.location.search);
const activeCourse = studentMockData.courses[parameters.get('active')];

const assessmentDetails = document.getElementById('assessmentDetails');

function loadAssessments() {
  const assessmentDetails = document.getElementById('assessmentDetails');
  let html = '';
  studentMockData.courses.forEach(course => { 

    if(activeCourse === course) {
      html += '<details open=true>';
    }
    else {
      html += '<details>';
    }

    html += `
      <summary class="course-header">
        <h2>${course.name}</h2> </summary>
      `;
    html += `<div class="assessment-group">`;
    course.assessments.forEach(assessment => {
      html += `
          <div class="assessment">
          <span class="assessment-title">${assessment.name}</span>
          <span class="assessment-grade">${assessment.earnedMarks}/${assessment.totalMarks}</span>
          <span class="assessment-type"> Type: ${assessment.type}</span>
          <span class="assessment-status"> Status: ${assessment.status}</span>
          </div>
      `;
    });
    html += `</div></details>`
  });
  assessmentDetails.innerHTML = html;
}

