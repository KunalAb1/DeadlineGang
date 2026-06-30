# DeadlineGang 📚

DeadlineGang is a classroom management platform that streamlines communication between teachers and students. The platform provides role-based access where teachers can manage classrooms and learning resources, while students can join classrooms and access shared content.

## ✨ Features

### Teacher

* Register and log in securely
* Verify account through email
* Create and manage classrooms
* Create, edit, and delete classroom posts
* Upload study materials and files
* Share announcements with students

### Student

* Register and log in securely
* Verify account through email
* Search and join classrooms
* View classroom posts and announcements
* Download uploaded study materials

## 🛠 Tech Stack

### Frontend

* React
* React Router
* HTML & CSS

### Backend

* Node.js
* Express.js
* MongoDB Atlas
* Mongoose
* JWT Authentication
* Nodemailer

## 📂 Project Structure

```text
DeadlineGang
│
├── deadlinegangbackend
│
└── deadlinegangfrontend
```

## ⚙️ Environment Variables

Both the frontend and backend include a `.env.example` file that lists the required environment variables.

Create a `.env` file in each project directory and add your own configuration values before running the application.

## 🚀 Getting Started

### Clone the repository

```bash
git clone https://github.com/KunalAb1/DeadlineGang.git
```

### Backend

```bash
cd deadlinegangbackend
npm install
nodemon index.js
```

### Frontend

```bash
cd deadlinegangfrontend
npm install
npm start
```

## 🔐 Authentication

* Email verification using Nodemailer
* JWT-based authentication
* Role-based authorization for Teachers and Students

## 🚧 Future Improvements

* Dark and Light theme
* Display classroom members
* Student comments on classroom posts
* UI/UX improvements and responsiveness enhancements

## 👨‍💻 Author

**Kunal Abhang**


---

⭐ If you found this project useful, consider giving it a star on GitHub.
