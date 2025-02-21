/**
 * Course Evaluation Helper Script
 * A utility to set default values for course evaluation radio buttons
 * 
 * @param {string} rating - The rating to apply ('strongly agree', 'agree', 'uncertain', 'dissatisfied', 'strongly disagree')
 * @returns {string} A message indicating how many questions were processed
 */
function selectAllRadios(rating) {
    // Map ratings to their position in the options (0-based index)
    const ratingPositionMap = {
      'strongly agree': 0,
      'agree': 1,
      'uncertain': 2,
      'dissatisfied': 3,
      'strongly disagree': 4
    };
  
    const position = ratingPositionMap[rating.toLowerCase()];
    if (position === undefined) {
      console.error('Invalid rating. Please use: strongly agree, agree, uncertain, dissatisfied, or strongly disagree');
      return 'Error: Invalid rating';
    }
  
    // Get all question groups
    const questions = document.querySelectorAll('.m-list-timeline__item');
    
    let count = 0;
    questions.forEach(question => {
      // Get all radio buttons for this question
      const radioButtons = question.querySelectorAll('input[type="radio"]');
      
      // Select the radio button at the specified position
      if (radioButtons[position]) {
        radioButtons[position].click();
        count++;
      }
    });
  
    return `Successfully selected "${rating}" for ${count} questions`;
  }