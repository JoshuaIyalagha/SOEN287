document.addEventListener('DOMContentLoaded', function() {
  loadCourseDetails();
});


parameters = new URLSearchParams(document.location.search);
const course = studentMockData.courses[parameters.get('courseId')];


function loadCourseDetails() {

  courseDetails = document.getElementById('courseDetails');
  let html = `
          <h2 id="courseHeader">${course.name} - ${course.code}</h2>
          <span id="courseTerm">${course.term}</span>
          <span id="courseProfessor">${course.instructor}</span> <br>
          <span id="courseGrade">Current Grade: ${course.currentGrade}%</span>
          <span id="courseProgress">Current Progress: ${course.progress}%</span>
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
