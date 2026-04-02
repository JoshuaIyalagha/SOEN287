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


    

    
    enrolledCourses = await getEnrolled(studentId);

    enrolledCourses.forEach(course => {

        html += `
            <div class="card">
                <span class="course-header">
                    <span>
                        <span class="course-code">${course.code}</span>
                        <span class="course-name"> - ${course.name}</span>
                    </span>
                    <button class="btn-remove" onclick="removeCourse(${course.id})">Remove Course</button>
                    <div class="course-status">
                        <span> Grade: ${course.currentGrade}%</span>
                    </div>
                </span>
                <div class="course-details">
                    <span>👥 ${course.instructor}</span>
                    <span>📚 ${course.term}</span>
                </div>
                <div class="course-description mb-1">
                    <span> ${course.progress}% Completed </span>
                </div>
                <div class="course-actions">
                    <a href="course-view.html?courseId=${course.id}" class="btn btn-outline">Course View</a>
                    <a href="assessments.html?active=${course.id}" class="btn btn-outline">View Assessments</a>
                    <a href="progressbar.html?courseId=${course.id}" class="btn btn-outline">View Stats</a>
                </div>
            </div>
        `;
    });

    let options = '<option value="" selected disabled> Select a Course</option>';
    const coursesSelect = document.getElementById('coursesSelect');


    catalog = await getCatalog();
    if(catalog === undefined) {
        return;
    }
    catalog.forEach(course => {
        options += `
    <option value="${course.id}"> ${course.code}, ${course.name} </option>
    `;
    })
  

    coursesSelect.innerHTML = options;

    coursesList.innerHTML = html;
}

async function addCourse() {

    const courseId = document.getElementById('coursesSelect').value;
    
    const duplicate = (enrolledCourses).some(function (course) {
        return course.id == courseId;
    });

    if(duplicate) {
        window.alert("Duplicate Course Added");
        return;
    }

    try {
    const response = await fetch(`${API_BASE}/enrollment`, {
        method: 'POST',
        headers: { 'Authorization': authToken },
        body: JSON.stringify({studentId, courseId})
    });
    const data = await response.json();
    loadCourses();

    } catch(error) {
        console.log(`Error enrolling in course: ${error}`)
        showError(error);
    }
}
async function removeCourse(courseId) {
    if(confirm("Are you sure you want to remove this course?")){
        try {
            const response = await fetch(`${API_BASE}/enrollment`, {
                method: 'DELETE',
                headers: { 'Authorization': authToken },
                body: JSON.stringify({ studentId, courseId })
            });
            loadCourses();
        }
        catch (error) {
            console.log(`Error deleting enrollment: ${error}`)
            showError(error);
        }
    }
}


async function getEnrolled(studentId) {
    const response = await fetch(`${API_BASE}/enrollment/courses/${studentId}`, {
        method: 'GET',
        headers: { 'Authorization': authToken },
    });

    const data = await response.json();

    return data.courses;
}

async function getCatalog() {

    const response = (await fetch(`${API_BASE}/enrollment/catalog`, {
        method: 'GET',
        headers: { 'Authorization': authToken },
    }));
    const data = await response.json();
    return data.courses
}

