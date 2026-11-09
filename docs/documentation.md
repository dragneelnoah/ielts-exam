# IELTS Exam Platform - Developer & Teacher Documentation

## File Architecture
```text
Root/
├── css/
│   └── style.css          # Core styles, custom scrollbars & modal overlays
├── docs/
│   └── documentation.md   # System architecture and payload specifications
├── js/
│   ├── app.js             # Exam Engine (State Machine, Timers & DOM Rendering)
│   └── exam/
│       ├── exam-1.json    # Sample Test Paper 1
│       └── exam-2.json    # Sample Test Paper 2
├── index.html             # Single-Page Application Shell
└── README.md              # Deployment guide
```

## Adding New Exam Papers
To add a new exam paper:
1. Create a new `.json` file inside `js/exam/` (e.g. `exam-3.json`).
2. Follow the JSON structure outlined below.
3. Add the filename to the `examManifest` array in `js/app.js`:
   ```javascript
   const examManifest = [
       'exam-1.json',
       'exam-2.json',
       'exam-3.json'
   ];
   ```

## Exam JSON Format
Each section supports an `enabled` flag (`true` or `false`). If `enabled: false`, the section is skipped in the runner.

```json
{
  "examId": "exam-unique-id",
  "title": "Exam Title",
  "listening": {
    "enabled": true,
    "durationMinutes": 30,
    "instructions": "...",
    "questions": [
      { "id": "q1", "type": "text", "prompt": "Question text..." }
    ]
  },
  "reading": {
    "enabled": true,
    "durationMinutes": 60,
    "instructions": "...",
    "passageTitle": "...",
    "passageContent": "...",
    "questions": []
  },
  "writingTask1": {
    "enabled": true,
    "durationMinutes": 20,
    "instructions": "...",
    "promptTitle": "...",
    "promptDesc": "...",
    "chartType": "line",
    "labels": ["2010", "2020"],
    "datasets": []
  },
  "writingTask2": {
    "enabled": false,
    "durationMinutes": 40,
    "instructions": "",
    "prompt": ""
  }
}
```

## Student Output Payload
Upon completing the test, the runner compiles the answers into the following structure:

```json
{
  "studentName": "Student Name",
  "examId": "exam-1",
  "submittedAt": "2026-11-09T14:00:00.000Z",
  "results": {
    "listening": {
      "enabled": true,
      "answers": {
        "q1": "Answer 1"
      }
    },
    "reading": {
      "enabled": false
    },
    "writingTask1": {
      "enabled": true,
      "answers": {
        "essay": "Student essay response..."
      }
    },
    "writingTask2": {
      "enabled": false
    }
  }
}
```
