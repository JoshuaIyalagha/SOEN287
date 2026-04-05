const API_BASE = 'http://localhost:3000/api';

let authToken = null;
let studentId = null;
let courseId = null;

document.addEventListener('DOMContentLoaded', function() {
  authToken = localStorage.getItem('token');
  if (!authToken) {
    window.location.href = '../login.html';
    return;
  }
  
  const decoded = JSON.parse(atob(authToken));
  studentId = decoded.id;
  
  const parameters = new URLSearchParams(document.location.search);
  courseId = parseInt(parameters.get('courseId'));
  
  if (!courseId) {
    document.getElementById('courseDetails').innerHTML = '<p>Error: Course ID not found</p>';
    return;
  }
  
  loadCourseDetails();
});

async function loadCourseDetails() {
  try {
    const courseDetails = document.getElementById('courseDetails');
    courseDetails.innerHTML = '<p>Loading...</p>';
    
    // Fetch course info and assessments
    const course = await getCourseData(courseId);
    const assessments = await getAssessments(courseId);
    const grades = await getGrades();
    const instructor = await getInstructor(course.instructor_id);
    let html = `
      <h2 class="course-header">${course.name} - ${course.code}</h2>
      <div class="course-details">
        <span class="course-term">${course.term}</span>
        <span class="course-grade">Current Grade: ${calculateGrade(assessments, grades)}%</span>
        <span class="course-instructor">Instructor: ${instructor.first_name} ${instructor.last_name}</span>
        <span class="course-progress">Current Progress: ${calculateProgress(assessments, grades)}%</span>
      </div>
      <h3>Assessments</h3>
    `;
    
    if (assessments.length === 0) {
      html += '<p>No assessments available</p>';
    } else {
      assessments.forEach(assessment => {
        const grade = grades.find(g => g.assessment_id === assessment.id);
        const score = grade.earned_marks ? grade.earned_marks : 'Not Graded';
        const status = grade ? grade.status : 'Not submitted';
        
        html += `
          <div class="assessment">
            <details>
              <summary class="assessment-title">${assessment.name}</summary>
              <div class="assessment-content">
                <span class="assesmentType">Type: ${assessment.type}</span>
                <span class="grade">Score: ${score}/${assessment.total_marks}</span>
                <span class="status">Status: ${status}</span>
              </div>
            </details>
          </div>
        `;
      });
    }
    
    courseDetails.innerHTML = html;
  } catch (error) {
    console.error('Error loading course details:', error);
    document.getElementById('courseDetails').innerHTML = `<p>Error loading course: ${error.message}</p>`;
  }
}

async function getCourseData(courseId) {
  const response = await fetch(`${API_BASE}/enrollment/courses/${studentId}`, {
    method: 'GET',
    headers: { 'Authorization': authToken }
  });
  
  if (!response.ok) throw new Error('Failed to fetch course');
  
  const data = await response.json();
  const course = data.courses.find(c => c.id === courseId);
  
  if (!course) throw new Error('Course not found');
  return course;
}

async function getAssessments(courseId) {
  const response = await fetch(`${API_BASE}/courses/${courseId}/assessments`, {
    method: 'GET',
    headers: { 'Authorization': authToken }
  });
  
  if (!response.ok) throw new Error('Failed to fetch assessments');
  
  const data = await response.json();
  return data.assessments || [];
}

async function getGrades() {
  const response = await fetch(`${API_BASE}/students/${studentId}/grades`, {
    method: 'GET',
    headers: { 'Authorization': authToken }
  });
  
  if (!response.ok) throw new Error('Failed to fetch grades');
  
  const data = await response.json();
  return data.grades || [];
}

async function getInstructor(instructorId) {
  const response = await fetch(`${API_BASE}/instructors/${instructorId}`, {
    method: 'GET',
    headers: { 'Authorization': authToken }
  });
  
  if (!response.ok) throw new Error('Failed to fetch instructor');
  
  const data = await response.json();
  return data.instructor;
}

function calculateGrade(assessments, grades) {
  if (assessments.length === 0) return 0;
  
  let totalEarned = 0;
  let totalMarks = 0;
  
  assessments.forEach(assessment => {
    const grade = grades.find(g => g.assessment_id === assessment.id);
    if (grade && grade.earned_marks !== null) {
      totalEarned += Number(grade.earned_marks);
      totalMarks += Number(assessment.total_marks);
    }
  });
  
  return totalMarks > 0 ? Math.round((totalEarned / totalMarks) * 100) : 0;
}

function calculateProgress(assessments, grades) {
  if (assessments.length === 0) return 0;
  
  const graded = assessments.filter(assessment => {
    return grades.some(g => g.assessment_id === assessment.id && g.status === 'completed');
  }).length;
  return Math.round((graded / assessments.length) * 100);
}
