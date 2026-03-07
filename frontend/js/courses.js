document.addEventListener('DOMContentLoaded', function() {
    loadCourses();
});

const submitCourse = document.getElementById('addCourseButton');

submitCourse.addEventListener('click', function() {
  addCourse();
});





// Load courses into the dashboard
function loadCourses() {
    const coursesList = document.getElementById('coursesList');
    let html = '';

    let i = 0;

    studentMockData.courses.forEach(course => {

        html += `
            <div class="course-card">
                <div class="course-header">
                    <div>
                        <span class="course-code">${course.code}</span>
                        <span class="course-name"> - ${course.name}</span>
                    </div>
                    <div class="course-status">
                        <span> Grade: ${course.currentGrade}%</span>
                    </div>
                </div>
                <div class="course-details">
                    <span>👥 ${course.instructor}</span>
                    <span>📚 ${course.term}</span>
                </div>
                <div class="course-description mb-1">
                    <span> ${course.progress}% Completed </span>
                </div>
                <div class="course-actions">
                    <a href="course-view.html?courseId=${i}" class="btn btn-outline">Course View</a>
                    <a href="assessments.html?active=${i}" class="btn btn-outline">View Assessments</button>
                    <a href="progressbar.html?courseId=${course.id}" class="btn btn-outline">View Stats</a>
                </div>
            </div>
        `;
      i++;
    });

    let options = '';
    const coursesSelect = document.getElementById('coursesSelect');

  instructorMockData.courses.forEach(course => {
    options += `
    <option> ${course.code}, ${course.name} </option>
    `;
  })

    coursesSelect.innerHTML += options;

    coursesList.innerHTML = html;
}

function addCourse() {

  console.log("test");
  window.alert("Course Added in deliverable 2");



}




