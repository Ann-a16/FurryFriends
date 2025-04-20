
  document.addEventListener('DOMContentLoaded', function() {
    const button = document.querySelector('.frame23-frame8button');
  
    button.addEventListener('mouseover', function() {
      this.style.backgroundColor = '#955DE8';
    });
  
    button.addEventListener('mouseout', function() {
      this.style.backgroundColor = 'rgba(148, 93, 232, 0.3700000047683716)';
    });
  });

  // Обработчик входа
document.getElementById('loginForm').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const phone = document.querySelector('.frame23-frame5input').value;
  const password = document.querySelector('.frame23-frame9input').value;
  const user = usersDB[phone];
  
  if (!user || user.password !== password) {
    alert('Неверный номер или пароль!');
    return;
  }
  
  alert(`Добро пожаловать, ${user.name}!`);
  // Дополнительные действия после входа
  window.location.href = 'profile_user.html'; // Переход на профиль
  });