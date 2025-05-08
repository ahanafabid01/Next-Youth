/**
 * Adds toggle functionality to FAQ items
 * @param {HTMLElement} faqContainer - The container with all FAQ items
 */
export const initFaqToggle = (faqContainer) => {
  if (!faqContainer) return;
  
  // First, remove any existing event listeners to prevent duplicates
  const faqItems = faqContainer.querySelectorAll('.seller-faq-item');
  
  faqItems.forEach(item => {
    const question = item.querySelector('.seller-faq-question');
    
    // Clone and replace to remove old event listeners
    const newQuestion = question.cloneNode(true);
    question.parentNode.replaceChild(newQuestion, question);
    
    newQuestion.addEventListener('click', () => {
      console.log('FAQ question clicked'); // Debug log
      
      // Close all other items
      faqItems.forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.classList.remove('open');
        }
      });
      
      // Toggle current item
      item.classList.toggle('open');
    });
  });
  
  console.log('FAQ toggle initialized with', faqItems.length, 'items'); // Debug log
};