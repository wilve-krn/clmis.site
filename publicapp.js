document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerModal = document.getElementById('registerModal');
    const showRegisterModal = document.getElementById('showRegisterModal');
    const closeBtn = document.querySelector('.close');
    const registerForm = document.getElementById('registerForm');

    // Modal controls
    showRegisterModal.addEventListener('click', (e) => {
        e.preventDefault();
        registerModal.style.display = 'block';
    });

    closeBtn.addEventListener('click', () => {
        registerModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === registerModal) registerModal.style.display = 'none';
    });

    // Universal Login Execution
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userId = document.getElementById('userId').value.trim();
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, password })
            });
            const data = await response.json();

            if (response.ok) {
                window.location.href = data.redirect;
            } else {
                alert(data.error || 'Login failed. Please check credentials.');
            }
        } catch (err) {
            alert('An error occurred during login. Please try again.');
        }
    });

    // Student Registration Execution
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            studentNumber: document.getElementById('regStudentNumber').value,
            fullName: document.getElementById('regFullName').value,
            age: document.getElementById('regAge').value,
            gender: document.getElementById('regGender').value,
            gradeSection: document.getElementById('regSection').value,
            email: document.getElementById('regEmail').value,
            userId: document.getElementById('regUserId').value,
            password: document.getElementById('regPassword').value,
            deviceOwnership: 'Personal',
            deviceUsed: 'Laptop',
            internetAccess: 'Wi-Fi',
            dailyUsage: '3–4 Hours',
            computerExperience: '1–3 Years',
            agreed: document.getElementById('regAgreed').checked
        };

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();

            if (response.ok) {
                alert('Registration successful! You may now log in.');
                registerModal.style.display = 'none';
                document.getElementById('userId').value = payload.userId;
            } else {
                alert(data.error || 'Registration failed.');
            }
        } catch (err) {
            alert('Server connection error during registration.');
        }
    });
});