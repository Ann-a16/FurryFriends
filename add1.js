document.getElementById('adForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
  
    try {
      const response = await fetch('http://localhost:3000/advertisements', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка сервера');
      }
  
      const result = await response.json();
      if (result.success) {
        window.location.href = 'ad_boarding.html';
      }
    } catch (error) {
      alert(error.message);
    } finally {
      submitBtn.disabled = false;
    }
  });