// Обработка регистрации
document.getElementById('signupForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        const formData = {
            name: document.getElementById('nameInput').value,
            phone: document.getElementById('phoneInput').value,
            password: document.getElementById('passwordInput').value,
            confirmPassword: document.getElementById('confirmPasswordInput').value
        };
        const response = await fetch('http://localhost:3000/register', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(formData)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Ошибка сервера');
        }
        const data = await response.json();
        if (data.success) {
            window.location.href = '/profile_user.html';
        } else {
            alert(data.error);
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Произошла ошибка при регистрации');
    }
});

  
// Обработка входа 
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        phone: document.getElementById('phoneInput').value,
        password: document.getElementById('passwordInput').value
    };

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
            credentials: 'include', 
        });

        const data = await response.json();
        if (data.success) {
            window.location.href = '/profile_user.html';
        } else {
            document.getElementById('errorMessage').textContent = data.error;
        }
    } catch (error) {
        console.error('Ошибка:', error);
    }
});

// Загрузка профиля
document.addEventListener('DOMContentLoaded', async () => {
    if (window.location.pathname.includes('profile_user.html')) {
        try {
            const response = await fetch('/profile');
            const user = await response.json();
            
            const userDataDiv = document.getElementById('userData');
            userDataDiv.innerHTML = `
                <p>Имя: ${user.name}</p>
                <p>Телефон: ${user.phone}</p>
            `;
        } catch (error) {
            window.location.href = '/input.html';
        }
    }
});

// Выход
function logout() {
    fetch('/logout', { method: 'POST',
        credentials: 'include'
    })
        .then(() => window.location.href = '/input.html');
}