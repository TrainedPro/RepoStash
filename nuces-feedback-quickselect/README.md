# Course Evaluation Helper

A browser-based JavaScript utility that helps streamline the process of filling out course evaluation forms by setting default radio button selections across multiple questions.

## Purpose

This script provides a base/default selection for course evaluation forms, allowing quick selection of the same rating (e.g., "agree") across multiple questions. It is **not** intended to be a fully automated evaluation tool, but rather a starting point that you can then modify based on your actual assessment of the course.

## Important Notes

⚠️ **This is a helper tool, not an auto-evaluator:**
- Use this to set default values only
- You should review and modify individual answers based on your actual experience
- The purpose is to save time, not to submit identical ratings for every question

## Usage

### Prerequisites
- Navigate to your course's feedback/evaluation page
- Make sure all questions are visible on the page (scroll through if necessary)
- The page should be showing the radio button questions (Strongly Agree to Strongly Disagree options)

### Steps
1. Open your browser's developer console:
   - Chrome: Press `F12` or `Ctrl + Shift + J` (Windows/Linux) or `Cmd + Option + J` (Mac)
   - Navigate to the "Console" tab

2. Copy and paste the entire contents of `courseEvalHelper.js` into the console

3. Execute the function with your desired default rating:
```javascript
selectAllRadios('agree')
```

## Available Ratings

- `'strongly agree'`
- `'agree'`
- `'uncertain'`
- `'dissatisfied'`
- `'strongly disagree'`

## Best Practices

1. **Set Default Values**: Use the script to set a baseline rating that matches your general impression of the course.
2. **Review Each Question**: Go through each question individually and adjust ratings based on your specific experiences.
3. **Provide Thoughtful Feedback**: Remember that course evaluations are important for improving education quality.

## Installation

No installation required. This is a browser console script that can be copied and pasted directly into your browser's developer console.

## Limitations

- The script is designed for the specific HTML structure of the current course evaluation form
- It may need modification if the form structure changes
- Some questions may require different ratings based on their specific content
- The script does not handle text-based feedback sections

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Responsible Usage

Remember that course evaluations are an important tool for:
- Improving course quality
- Providing feedback to instructors
- Helping future students

Please use this script responsibly and ensure your final submission reflects your honest assessment of the course.