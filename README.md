# IELTS Exam Platform (GitHub Pages Compatible)

An efficient, zero-backend, client-side IELTS online exam runner designed for English teachers and students. Completely customizable via JSON files without requiring server setup.

## Features
- **Zero-Backend Hosting**: Deploys directly on GitHub Pages.
- **Dynamic Exam Randomization**: Randomly selects an exam paper from `js/exam/` on launch.
- **Separation of Concerns**: Exam content and UI engine are strictly segregated.
- **Section Isolation & Irreversible Navigation**: One section at a time with strict warnings before advancing.
- **Individual Countdown Timers**: Separate timing for each module with automated timeout transitions.
- **Dynamic Section Skipping**: Omitting or disabling sections in JSON automatically skips them and marks `{"enabled": false}` in the student output.
- **Chart Integration**: Uses Chart.js for Academic Task 1 visualization.
- **Submission Workflow**: Generates downloadable JSON result files and pre-formatted email submissions.

## Setup & Deployment
1. Push this repository to GitHub.
2. Go to **Settings > Pages**.
3. Select the `main` branch as the build source and save.
4. Access your live exam site via `https://<username>.github.io/<repository-name>/`.
