document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('registerForm');
  const loginForm = document.getElementById('loginForm');

  const getFullPath = (path) => {
    return window.basePath === '/' ? path : `${window.basePath}${path}`;
  };

  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;

    try {
      const response = await fetch(getFullPath('/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Failed to register');
      }

      const data = await response.json();
      console.log('Register response:', data);
      alert('Registration successful!');
    } catch (error) {
      console.error('Error:', error);
      alert('Registration failed!');
    }
  });

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    try {
      const response = await fetch(getFullPath('/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Failed to login');
      }

      const data = await response.json();
      console.log('Login response:', data);
      alert('Login successful!');

      // Store the token in localStorage or sessionStorage
      localStorage.setItem('token', data.token);

      // Redirect to the dashboard page
      window.location.href = getFullPath('/dashboard');
    } catch (error) {
      console.error('Error:', error);
      alert('Login failed!');
    }
  });

  // Function to get token from local storage
  const getToken = () => localStorage.getItem('token');
});