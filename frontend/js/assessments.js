const API_BASE = 'http://localhost:3000/api';

let authToken = null;
let studentId = null;
let enrolledCourses = null;
let assessmentIdForSubmission = null;

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
// Active course for navigating from courses page to assessments page
const activeCourseId = parameters.get('active');

const assessmentDetails = document.getElementById('assessmentDetails');

async function loadAssessments() {
  let html = '';

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

    const categories = await getCategories(course.id);
    const assessments = await getAssessments(course.id);
    const submissions = await getSubmissions();

    if(categories.length === 0) {
      html +=`
      <div class="assessment">
        <span>No data.</span>;
      </div>
      `;
    }

    for(const category of categories) {

      html += loadCategory(category, assessments, submissions);
    }

    html += `</details>`;
  }
  assessmentDetails.innerHTML = html;
}

//API Calls

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
async function getSubmissions() {
  const response = await fetch(`${API_BASE}/submissions/${studentId}`, {
      method: 'GET',
      headers: { 'Authorization': authToken },
  });
  const data = await response.json();

  return data.submissions;
}

//loading logic
function loadAssessment(assessment,submissions) {
      let submission = null;
      if(submissions != undefined) {
        submission = submissions.find(function(submission) {
        return submission.assessment_id === assessment.id;
      });
      }
      let html = `
          <div class="assessment">
          <span class="assessment-title">${assessment.name}</span>
          <span class="assessment-grade">${submission.marks_obtained ? submission.marks_obtained : '~'}/${assessment.total_marks}</span>
          <span class="assessment-type"> Type: ${assessment.type}</span>
          <span class="assessment-status"> Status: ${submission ? submission.status : 'N/A'}</span>
          </div>
          <div class="submission">
          ${submission ? `<span>Submitted on: ${new Date(submission.submitted_at).toLocaleString()}, Updated: ${new Date(submission.updated_at).toLocaleString()}</span>` : '<span>No submission yet.</span>'}
          <button class="btn" onclick="newSubmission(${assessment.id})">New Submission</button>
          </div>
      `;
      return html;
}

function loadCategory(category, assessments, submissions) {
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
      
      html += loadAssessment(assessment, submissions);

    }



      html += `</div>`;

      return html;
}



//Submissions Logic


function newSubmission(assessmentId) {
  assessmentIdForSubmission = assessmentId;
  const modal = document.getElementById('submissionModal');
  modal.style.display = 'block';
  document.getElementById('submissionForm').reset();
}
function closeSubmissionModal() {
  const modal = document.getElementById('submissionModal');
  modal.style.display = 'none';
  assessmentIdForSubmission = null;
}

async function submitAssessment() {
  const content = document.getElementById('submissionContent').value;
  const fileInput = document.getElementById('submissionFile');
  const file = fileInput.files[0];

  if (!content && !file) {
    alert('Please provide either content or upload a file');
    return;
  }

  if (!assessmentIdForSubmission) {
    alert('Error: Assessment ID not found');
    return;
  }

  let filePath = null;
  if (file) {
    filePath = `/uploads/submissions/${studentId}_${assessmentIdForSubmission}_${file.name}`;
  }

  const submissionData = {
    student_id: studentId,
    assessment_id: assessmentIdForSubmission,
    content: content || null,
    file_path: filePath
  };
  console.log(submissionData);

  try {
    const response = await fetch(`${API_BASE}/submissions`, {
      method: 'POST',
      headers: {
        'Authorization': authToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(submissionData)
    });

    const data = await response.json();

    if (response.ok) {
      alert('Submission successful!');
      closeSubmissionModal();
      loadAssessments(); // Reload assessments to show updated submission
    } else {
      alert('Error: ' + (data.message || 'Failed to submit'));
    }
  } catch (error) {
    console.error('Submission error:', error);
    alert('Error submitting: ' + error.message);
  }
}

// Close modal when clicking outside of it
window.onclick = function(event) {
  const modal = document.getElementById('submissionModal');
  if (event.target == modal) {
    modal.style.display = 'none';
  }
}