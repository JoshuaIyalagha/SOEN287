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
      <summary class="course-information">${course.name}
      </summary>
      `;
    course.assessments.forEach(assessment => {
      html += `
          <div class="assessment-content">
          <span id="assesmentType"> Type: ${assessment.type}</span>
          <span id="grade"> Score: ${assessment.earnedMarks}/${assessment.totalMarks}</span>
          <span id="status"> Status: ${assessment.status}</span>
      `;
    });
    html += `</details>`
  });
  assessmentDetails.innerHTML = html;
}

