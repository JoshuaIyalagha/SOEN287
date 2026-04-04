# Smart Course Companion

A full-stack web application for managing courses, assessments, and student progress. Built with Node.js, MySQL, and vanilla JavaScript.    

---

## Quick Start

### Prerequisites
- Node.js v18+ (tested with v24.13.0)
- MySQL 8.0+ or MariaDB 10.6+
- Git

### 1. Clone the Repository
```git clone https://github.com/JoshuaIyalagha/SOEN287
cd SOEN287-GitClone
```
### 2. Install Dependencies
```
cd backend
npm install
```

### 3. Configure Database
Edit backend/config/database.js with your MySQL credentials:
```
module.exports = {
host: 'localhost',
user: 'root',
password: 'your-password',
database: 'smart_course_companion'
};
```

### 4. Initialize Database
# Drop and recreate database
```
mysql -u root -p -e "DROP DATABASE IF EXISTS smart_course_companion; CREATE DATABASE smart_course_companion;"

# Import schema with demo data
mysql -u root -p smart_course_companion < backend/schema.sql
```


### 5. Start the Server
```
node backend/server.js
Server starts at: http://localhost:3000
```

### 6. Login with Demo Credentials

| Role       | Email                   | Password            | Dashboard            |
|------------|-------------------------|---------------------|----------------------|
| Instructor | instructor@test.com     | instructor-password | Instructor Dashboard |
| Instructor | instructor2@test.com    | instructor-password | Instructor Dashboard |
| Student    | student@test.com        | password            | Student Dashboard    |
| Student    | student2@test.com       | password            | Student Dashboard    |
| Student    | student3@test.com       | password            | Student Dashboard    |

> **Note**: Demo credentials are hardcoded for convenience. Real user accounts use secure SHA256 password hashing. To disable demo logins for production, remove the DEMO_CREDENTIALS block in backend/routes/auth.js.

---

## Project Structure
```
SOEN287-GitClone/
├── backend/
│   ├── config/
│   │   └── database.js          # MySQL connection config
│   ├── models/
│   │   ├── Course.js            # Course model
│   │   └── User.js              # User model
│   ├── routes/
│   │   ├── auth.js              # Authentication (with demo bypass)
│   │   ├── courses.js           # Course CRUD routes
│   │   ├── grades.js            # Grade management routes
│   │   ├── assessments.js       # Assessment routes
│   │   ├── enrollment.js        # Enrollment routes
│   │   ├── profile.js           # Profile management
│   │   └── Instructor.js        # Instructor dashboard routes
│   ├── utils/
│   │   └── auth.js              # Password hashing utilities
│   ├── schema.sql               # Database schema + demo data
│   └── server.js                # Main server entry point
│
├── frontend/
│   ├── css/
│   │   ├── style.css            # Global styles with CSS variables
│   │   ├── instructor-dashboard.css
│   │   └── modal.css
│   ├── js/
│   │   ├── navbar.js            # Shared navbar logic
│   │   ├── theme.js             # Dark/light mode toggle
│   │   ├── toast.js             # Toast notification system
│   │   ├── instructor-dashboard.js
│   │   ├── student-dashboard.js
│   │   ├── assessments.js
│   │   ├── progressbar.js       # Student statistics
│   │   └── usage-statistics.js  # Instructor analytics
│   └── pages/
│       ├── login.html
│       ├── instructor-dashboard.html
│       ├── student-dashboard.html
│       ├── assessments.html
│       ├── progressbar.html
│       ├── usage-statistics.html
│       └── instructor-profile.html
│
├── README.md                    # This file
└── CONTRIBUTIONS.md             # Team contributions log
```
---

## Key Features

### Instructor Workflow
- Create, edit, and manage courses with assessment weighings
- Enter and manage student grades per assessment category
- View real-time analytics: completion rates, average grades, submission timelines
- Export course structures and grade reports as CSV
- Manage course templates for quick course creation
- Dark/light mode toggle with persistent preference

### Student Workflow
- Browse and enroll in available courses
- View enrolled courses with progress indicators
- Track grades per assessment category with final course grade calculation
- View upcoming assessments with due dates and urgency indicators
- Personalized dashboard with statistics and progress charts

### Technical Highlights
- JWT-based authentication with hardcoded demo bypass for testing
- SHA256 password hashing with salt for real user accounts
- MySQL persistence with foreign key constraints and cascading deletes
- Dark mode support via CSS variables and localStorage
- Chart.js visualizations for analytics and progress tracking
- RESTful API with proper error handling and status codes
- Responsive design that works on desktop and mobile

---

## API Endpoints

### Authentication
| Method | Endpoint          | Description                              |
|--------|-------------------|------------------------------------------|
| POST   | /api/login        | Authenticate user, return JWT token      |

### Courses
| Method | Endpoint                     | Description                              |
|--------|------------------------------|------------------------------------------|
| GET    | /api/courses                 | List all courses (instructor)            |
| GET    | /api/courses/:id             | Get course details                       |
| POST   | /api/courses                 | Create new course                        |
| PUT    | /api/courses/:id             | Update course                            |
| PUT    | /api/courses/:id/weighings   | Update assessment weighings              |
| DELETE | /api/courses/:id             | Delete course                            |

### Assessments & Categories
| Method | Endpoint                              | Description                              |
|--------|---------------------------------------|------------------------------------------|
| GET    | /api/courses/:id/assessments          | List assessments for course              |
| GET    | /api/courses/:id/assessment-categories| List assessment categories               |
| POST   | /api/courses/:id/assessments          | Create assessment                        |
| PUT    | /api/assessments/:id                  | Update assessment                        |
| DELETE | /api/assessments/:id                  | Delete assessment                        |

### Grades
| Method | Endpoint                                      | Description                              |
|--------|-----------------------------------------------|------------------------------------------|
| GET    | /api/courses/:id/grades                       | Get all grades for course (instructor)   |
| GET    | /api/students/:id/grades                      | Get grades for student                   |
| POST   | /api/grades                                   | Create/update grade (by assessment)      |
| POST   | /api/grades/category                          | Create/update grade (by category)        |
| GET    | /api/courses/:id/students/:id/final-grade     | Calculate final weighted grade           |
| DELETE | /api/grades/:id                               | Delete grade                             |

### Enrollment
| Method | Endpoint                              | Description                              |
|--------|---------------------------------------|------------------------------------------|
| POST   | /api/enrollment                       | Enroll student in course                 |
| DELETE | /api/enrollment                       | Unenroll student from course             |
| GET    | /api/enrollment/students/:courseId    | List enrolled students                   |
| GET    | /api/enrollment/courses/:studentId    | List enrolled courses for student        |
| GET    | /api/enrollment/catalog               | List all available courses               |

### Analytics
| Method | Endpoint                     | Description                              |
|--------|------------------------------|------------------------------------------|
| GET    | /api/instructor/dashboard    | Get instructor dashboard data            |
| GET    | /api/stats/completion        | Get assessment completion rates          |
| GET    | /api/stats/grades            | Get average grades by course             |
| GET    | /api/stats/timeline          | Get submission timeline data             |

### Profile
| Method | Endpoint              | Description                              |
|--------|-----------------------|------------------------------------------|
| GET    | /api/profile          | Get current user profile                 |
| PUT    | /api/profile          | Update profile information               |
| PUT    | /api/profile/password | Change password                          |
| DELETE | /api/profile          | Delete account                           |

---

## Testing

### Manual Testing
1. Start server: node backend/server.js
2. Open http://localhost:3000 in browser
3. Login with demo credentials (see table above)
4. Test instructor workflow: create course → add weighings → enter grades → view analytics
5. Test student workflow: enroll in course → view grades → track progress

### API Testing with curl
# Login and get token
```
curl -X POST http://localhost:3000/api/login \
-H "Content-Type: application/json" \
-d '{"email":"instructor@test.com","password":"instructor-password"}'
```

# Use token to access protected endpoint
```
curl -H "Authorization: YOUR_TOKEN_HERE" \
http://localhost:3000/api/instructor/dashboard
```
---

## Troubleshooting

### Port 3000 already in use
Fix: Kill existing process:
kill $(lsof -t -i:3000) 2>/dev/null || true
node backend/server.js

### Database import fails with foreign key errors
Fix: Ensure you're using the updated schema.sql with explicit ID assignments and proper table creation order (users → courses → categories → assessments → enrollments → grades).

### Charts not rendering in browser
Fix: Ensure you have internet access to load Chart.js from CDN (https://cdn.jsdelivr.net/npm/chart.js), or download it locally and update the script src.

### Dark mode not persisting
Fix: Theme preference is saved to localStorage. Clear browser storage if stuck, or check that theme.js is properly loaded in all pages.

### "Invalid credentials" for non-demo accounts
Fix: Real user accounts use SHA256 password hashing. Ensure:
1. Password is hashed using utils/auth.js hashPassword() function
2. Salt is stored in users.salt column
3. Hash is stored in users.passwordHash column
4. Login request sends correct email/password

### Demo logins not working
Fix: Ensure the DEMO_CREDENTIALS block in backend/routes/auth.js are present and not commented out. Demo accounts bypass hashing and check passwords directly.

---

## Security Notes

- Demo accounts use hardcoded credentials for testing convenience only
- Real user passwords are hashed using SHA256 with salt before storage (utils/auth.js)
- JWT tokens are used for API authentication with Base64 encoding
- All API endpoints validate authorization headers
- SQL queries use parameterized statements to prevent injection
- Sensitive operations (delete, password change) verify user ownership

> **For production deployment**:
> 1. Remove the DEMO_CREDENTIALS block from backend/routes/auth.js
> 2. Use environment variables for database credentials
> 3. Enable HTTPS
> 4. Implement rate limiting on auth endpoints
> 5. Add input sanitization middleware

---


---

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review browser console and server logs for error messages
3. Ensure all dependencies are installed: npm install in backend/
4. Verify database connection in backend/config/database.js
5. Confirm demo credentials are typed exactly as shown (case-sensitive)
6. Contact Joshua Iyalagha at joshuaiyalagha@outlook.com

---

README.md written by Joshua Iyalagha 40306001

