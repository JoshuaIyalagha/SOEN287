document.addEventListener('DOMContentLoaded', function() {
  loadCourseDetails();
});


parameters = new URLSearchParams(document.location.search);
const course = studentMockData.courses[parameters.get('courseId')];


function loadCourseDetails() {

  courseDetails = document.getElementById('courseDetails');
  let html = `
          <h2 class="course-header">${course.name} - ${course.code}</h2>
        <div class="course-details">
          <span class="course-term">${course.term}</span>
          <span class="course-grade">Current Grade: ${course.currentGrade}%</span>
          <span class="course-instructor">${course.instructor}</span>
          <span class="course-progress">Current Progress: ${course.progress}%</span>
        </div>
          <h3>Assessments</h3>
      `;
  course.assessments.forEach(assessment => { 
    html += `
          <div class="assessment">
          <details>
          <summary class="assessment-title">${assessment.name}</summary>
          <div class="assessment-content">
          <span id="assesmentType"> Type: ${assessment.type}</span>
          <span id="grade"> Score: ${assessment.earnedMarks}/${assessment.totalMarks}</span>
          <span id="status"> Status: ${assessment.status}</span>
          </div>
          </details>
          </div> 
            `;
    

  });
  

  courseDetails.innerHTML = html;
}
