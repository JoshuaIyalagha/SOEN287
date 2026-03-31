const API_BASE = 'http://localhost:3000/api';

let authToken = null;

document.addEventListener('DOMContentLoaded', function() {

    authToken = localStorage.getItem('token');
    if (!authToken) {
        window.location.href = '../login.html';
        return;
    }


    loadCourses();
});

const submitCourse = document.getElementById('addCourseButton');

submitCourse.addEventListener('click', function() {
  addCourse();
});





// Load courses into the dashboard
async function loadCourses() {
    const coursesList = document.getElementById('coursesList');
    let html = '';


    const decoded = JSON.parse(atob(authToken));
    const studentId = decoded.id;
    

    const response = await fetch(`${API_BASE}/enrollment/courses/${studentId}`, {
        method: 'GET',
        headers: { 'Authorization': authToken },
    });

    const data = await response.json();
    
    const enrolledCourses = data.courses;

    enrolledCourses.forEach(course => {

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
                    <a href="course-view.html?courseId=${course.id}" class="btn btn-outline">Course View</a>
                    <a href="assessments.html?active=${course.id}" class="btn btn-outline">View Assessments</button>
                    <a href="progressbar.html?courseId=${course.id}" class="btn btn-outline">View Stats</a>
                </div>
            </div>
        `;
    });

    /*
    let options = '';
    const coursesSelect = document.getElementById('coursesSelect');
    const allCourses = await fetch(`${API_BASE}/enrolled/catalog`, {
        method: 'GET',
        headers: { 'Authorization': authToken },
    });

    allCourses.forEach(course => {
    options += `
    <option> ${course.code}, ${course.name} </option>
    `;
  })

    coursesSelect.innerHTML += options;
    */

    coursesList.innerHTML = html;
}

function addCourse() {

  console.log("test");
  window.alert("Course Added in deliverable 2");



}




