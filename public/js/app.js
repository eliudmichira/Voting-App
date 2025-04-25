document.addEventListener('DOMContentLoaded', function() {
  // Add more extensive debug logging
  console.log('Auth check - Current path:', window.location.pathname);
  
  const authToken = localStorage.getItem('auth_token');
  const user = localStorage.getItem('user');
  
  console.log('Auth token present:', !!authToken);
  console.log('User data present:', !!user);
  
  if (authToken) {
    console.log('Token value:', authToken);
    try {
      const userData = JSON.parse(user || '{}');
      console.log('User role:', userData.role);
    } catch (e) {
      console.error('Error parsing user data', e);
    }
  }
  
  // Get current page path
  const currentPath = window.location.pathname;
  
  // More robust path checking
  const isLoginPage = currentPath.includes('login.html') || currentPath === '/login';
  const isIndexPage = currentPath.includes('index.html') || currentPath === '/' || currentPath === '';
  
  console.log('Is login page:', isLoginPage);
  console.log('Is index page:', isIndexPage);
  
  if (!authToken && !isLoginPage) {
    console.log('No auth token found, redirecting to login');
    // Not authenticated and not on login page - redirect to login
    window.location.href = '/login.html';
  } else if (authToken && isLoginPage) {
    console.log('Auth token found on login page, redirecting to index');
    // Already authenticated but on login page - redirect to main app
    window.location.href = '/index.html';
  } else {
    console.log('No redirect needed');
  }
  
  // Rest of your initialization code...
}); 