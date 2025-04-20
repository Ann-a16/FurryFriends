document.addEventListener('DOMContentLoaded', async () => {
  const adsContainer = document.getElementById('adsContainer');
  const searchInput = document.getElementById('searchInput');
  const template = document.getElementById('adTemplate');

  if (!adsContainer || !searchInput || !template) {
      console.error('Не найдены необходимые элементы!');
      return;
  }

// Функция загрузки объявлений с поиском
const loadAds = async (searchTerm = '') => {
  try {
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    
    const response = await fetch(`/advertisements?${params.toString()}`);
    
    if (!response.ok) throw new Error(`Ошибка загрузки: ${response.status}`);
    
    const ads = await response.json();

    const userResponse = await fetch('/profile', { credentials: 'include' });
    const user = await userResponse.json();

    renderAds(ads, user._id);
  } catch (error) {
    console.error('Ошибка:', error);
    alert('Не удалось загрузить объявления');
  }
};

  // Рендеринг объявлений
  const renderAds = (ads, currentUserId) => { // Добавляем currentUserId
    adsContainer.innerHTML = '';
      
      ads.forEach(ad => {
          const clone = template.content.cloneNode(true);
          const elements = {
              title: clone.querySelector('.ad-title'),
              location: clone.querySelector('.ad-location'),
              description: clone.querySelector('.ad-description'),
              image: clone.querySelector('.ad-image'),
              btn: clone.querySelector('.respond-btn'),
              item: clone.querySelector('.ad-item')
          };

          const isAuthor = ad.author._id === currentUserId;
    
          if (isAuthor) {
            const controls = document.createElement('div');
            controls.className = 'ad-controls';
            
            const editBtn = document.createElement('button');
            editBtn.className = 'edit-btn';
            editBtn.textContent = 'Редактировать';
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = 'Удалить';
            
            controls.appendChild(editBtn);
            controls.appendChild(deleteBtn);
            elements.item.appendChild(controls);
          }

          // Заполнение данных
          if (elements.title) elements.title.textContent = ad.title;
          if (elements.location) elements.location.textContent = ad.location;
          if (elements.description) elements.description.textContent = ad.description;

          // Обработка изображения
          if (elements.image) {
              elements.image.style.display = ad.images?.[0] ? 'block' : 'none';
              if (ad.images?.[0]) elements.image.src = ad.images[0];
          }

          // Добавление ID объявления
          if (elements.item) elements.item.dataset.id = ad._id;

          adsContainer.appendChild(clone);
      });
  };

  // Обработчик поиска с задержкой
  let searchTimeout;
  searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
          loadAds(e.target.value.trim());
      }, 300);
  });

  // Первоначальная загрузка
  adsContainer.innerHTML = '<div class="loading">Загрузка...</div>';
  loadAds();

 // Обработчик отклика
 document.addEventListener('click', async (e) => {
  const btn = e.target.closest('.respond-btn');
  if (!btn) return;
  
  const adItem = btn.closest('.ad-item');
  if (!adItem || !adItem.dataset.id) {
      alert('Ошибка: объявление не найдено');
      return;
  }
  
  try {
      const response = await fetch('/responses', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ adId: adItem.dataset.id }),
          credentials: 'include'
      });
      
      // Обрабатываем случай, когда сервер возвращает HTML (например, 404 страницу)
      const contentType = response.headers.get('content-type');
      let result;
      
      if (contentType && contentType.includes('application/json')) {
          result = await response.json();
      } else {
          const text = await response.text();
          throw new Error(`Ошибка сервера: ${text}`);
      }
      
      if (!response.ok) {
          throw new Error(result.error || 'Ошибка отклика');
      }

      const authorInfo = result.author 
          ? `Автор объявления:\nИмя: ${result.author.name}\nТелефон: ${result.author.phone}`
          : 'Данные автора недоступны';

      alert(`✅ Отклик успешно отправлен!\n\n${authorInfo}`);
      
  } catch (error) {
      alert(error.message);
      console.error('Ошибка отклика:', error);
  }
});
document.addEventListener('click', async (e) => {
  // Обработчик удаления
  if (e.target.classList.contains('delete-btn')) {
    const adItem = e.target.closest('.ad-item');
    const adId = adItem.dataset.id;
    
    // Добавляем подтверждение
    const isConfirmed = confirm('Вы точно хотите удалить это объявление?');
    if (!isConfirmed) return;

    try {
      const response = await fetch(`/advertisements/${adId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Ошибка удаления!  Вы не являетесь автором');
      adItem.remove();
    } catch (error) {
      alert(error.message);
    }
  }
  
  // Обработчик редактирования
  if (e.target.classList.contains('edit-btn')) {
    const adItem = e.target.closest('.ad-item');
    const adId = adItem.dataset.id;
    
    // Реализуйте логику открытия формы редактирования
    // Например, можно показать модальное окно с полями:
    const title = prompt('Новое название услги:', adItem.querySelector('.ad-title').textContent);
    const description = prompt('Новое описание:', adItem.querySelector('.ad-description').textContent);
    const location = prompt('Новое местоположение:', adItem.querySelector('.ad-location').textContent);
    
    if (title && description && location) {
      try {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('location', location);
        
        const response = await fetch(`/advertisements/${adId}`, {
          method: 'PUT',
          body: formData,
          credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Ошибка обновления! Вы не являетесь автором');
        loadAds(); // Перезагружаем список
      } catch (error) {
        alert(error.message);
      }
    }
  }
});

});