/*
Smart Course Companion - Mock Data
Written by: Joshua Iyalagha 40306001
Purpose: Hard-coded data for Deliverable 1 - everyone on the team should use this structure
*/

// Instructor mock data - for my pages
const instructorMockData = {
    profile: {
        name: "Dr. Sarah Johnson",
        email: "instructor@test.com",
        role: "instructor",
        department: "Computer Science"
    },
    courses: [
        {
            id: 1,
            code: "SOEN287",
            name: "Web Programming",
            instructor: "Dr. Sarah Johnson",
            term: "Winter 2026",
            enabled: true,
            students: 45,
            description: "Introduction to web development with HTML, CSS, and JavaScript",
            assessmentCategories: [
                { category: "Assignments", weight: 40, count: 4 },
                { category: "Exams", weight: 50, count: 2 },
                { category: "Participation", weight: 10, count: 1 }
            ]
        },
        {
            id: 2,
            code: "COMP248",
            name: "Object-Oriented Programming",
            instructor: "Dr. Sarah Johnson",
            term: "Winter 2026",
            enabled: true,
            students: 62,
            description: "Java programming fundamentals and OOP concepts",
            assessmentCategories: [
                { category: "Labs", weight: 20, count: 10 },
                { category: "Assignments", weight: 30, count: 3 },
                { category: "Midterm", weight: 20, count: 1 },
                { category: "Final", weight: 30, count: 1 }
            ]
        },
        {
            id: 3,
            code: "COMP352",
            name: "Data Structures",
            instructor: "Dr. Sarah Johnson",
            term: "Winter 2026",
            enabled: false,
            students: 38,
            description: "Advanced data structures and algorithms",
            assessmentCategories: [
                { category: "Assignments", weight: 35, count: 4 },
                { category: "Quizzes", weight: 15, count: 5 },
                { category: "Midterm", weight: 20, count: 1 },
                { category: "Final", weight: 30, count: 1 }
            ]
        }
    ],
    templates: [
        {
            id: 101,
            name: "Web Programming Template",
            description: "Standard structure for web courses",
            categories: [
                { category: "Assignments", weight: 40 },
                { category: "Exams", weight: 50 },
                { category: "Participation", weight: 10 }
            ]
        },
        {
            id: 102,
            name: "Programming Course Template",
            description: "For programming heavy courses",
            categories: [
                { category: "Labs", weight: 20 },
                { category: "Assignments", weight: 30 },
                { category: "Midterm", weight: 20 },
                { category: "Final", weight: 30 }
            ]
        }
    ],
    usageStats: {
        completionRates: [
            { course: "SOEN287", assessment: "Assignment 1", completed: 38, total: 45 },
            { course: "SOEN287", assessment: "Assignment 2", completed: 25, total: 45 },
            { course: "COMP248", assessment: "Lab 1", completed: 58, total: 62 },
            { course: "COMP248", assessment: "Lab 2", completed: 52, total: 62 },
            { course: "COMP352", assessment: "Assignment 1", completed: 20, total: 38 }
        ],
        submissionsTimeline: [
            { date: "Feb 10", count: 12 },
            { date: "Feb 11", count: 20 },
            { date: "Feb 12", count: 15 },
            { date: "Feb 13", count: 25 },
            { date: "Feb 14", count: 30 },
            { date: "Feb 15", count: 18 }
        ],
        averageGrades: [
            { course: "SOEN287", average: 78.5 },
            { course: "COMP248", average: 72.3 },
            { course: "COMP352", average: 68.2 }
        ]
    }
};

// I'll also include student data structure so everyone knows what to expect
const studentMockData = {
    profile: {
        name: "John Student",
        email: "student@test.com",
        role: "student",
        id: "12345678"
    },
    courses: [
        {
            code: "SOEN287",
            name: "Web Programming",
            instructor: "Dr. Sarah Johnson",
            term: "Winter 2026",
            currentGrade: 85,
            progress: 65,
            assessments: [
                { name: "Assignment 1", type: "assignment", dueDate: "2026-02-15", totalMarks: 100, earnedMarks: 85, status: "completed" },
                { name: "Assignment 2", type: "assignment", dueDate: "2026-02-27", totalMarks: 100, earnedMarks: null, status: "pending" }
            ]
        }
    ]
};