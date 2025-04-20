document.addEventListener('DOMContentLoaded', function() {
    const button = document.querySelector('.frame28-frame8button1');
  
    button.addEventListener('mouseover', function() {
      this.style.backgroundColor = '#955DE8';
    });
  
    button.addEventListener('mouseout', function() {
      this.style.backgroundColor = 'rgba(148, 93, 232, 0.3700000047683716)';
    });
  });