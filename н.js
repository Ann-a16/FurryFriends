document.addEventListener('DOMContentLoaded', function() {
    const buttons = document.querySelectorAll('.frame17-text1, .frame17-text3, .frame17-text4, .frame17-text5');
  
    buttons.forEach(button => {
      button.addEventListener('click', function() {
        // Действие при клике на кнопку
        console.log('Кнопка нажата!');
      });
    });
  });
  