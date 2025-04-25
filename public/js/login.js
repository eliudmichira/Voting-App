document.getElementById('loginForm').addEventListener('submit', async function(event) {
  event.preventDefault();
  
  // Show loading indicator
  document.getElementById('loginStatus').textContent = 'Logging in...';
  
  try {
    const nationalId = document.getElementById('nationalId').value;
    const password = document.getElementById('password').value;
    const walletAddress = document.getElementById('walletAddress')?.value || '';
    
    console.log('Submitting login with:', { nationalId, walletAddress });
    
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nationalId,
        password,
        walletAddress
      })
    });
    
    const data = await response.json();
    console.log('Login response:', data);
    
    if (data.success === true) {
      // Debug: Check what we're storing
      console.log('Storing token:', data.token);
      console.log('Storing user:', data.user);
      
      // Store the token properly
      localStorage.setItem('auth_token', data.token);
      
      // Store user info if needed
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Show success message
      document.getElementById('loginStatus').textContent = 'Login successful! Redirecting...';
      
      // Debug: Log before redirect
      console.log('About to redirect to index.html');
      
      // Redirect to the main application page
      window.location.href = '/index.html';
    } else {
      // Handle login error
      document.getElementById('loginStatus').textContent = data.message || 'Login failed';
    }
  } catch (error) {
    console.error('Login error:', error);
    document.getElementById('loginStatus').textContent = 'Network or server error';
  }
});

function setupPasswordToggle() {
  // Try different possible selectors for password input
  const passwordInput = document.getElementById('password') || 
                        document.querySelector('input[type="password"]');
  
  // Try different possible selectors for toggle button
  const toggleButton = document.getElementById('togglePassword') || 
                       document.querySelector('.password-toggle') ||
                       document.querySelector('.toggle-password');
  
  console.log('Password elements found:', { 
    passwordInput: passwordInput ? true : false, 
    toggleButton: toggleButton ? true : false 
  });
  
  if (passwordInput && toggleButton) {
    toggleButton.addEventListener('click', function(e) {
      e.preventDefault(); // Prevent form submission if button is inside form
      
      // Toggle the password visibility
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      
      console.log('Password visibility toggled to:', type);
      
      // Toggle the icon/text - adapt based on your HTML structure
      if (toggleButton.querySelector('i')) {
        // If using Font Awesome or similar icons
        if (type === 'password') {
          toggleButton.querySelector('i').className = 'fas fa-eye';
        } else {
          toggleButton.querySelector('i').className = 'fas fa-eye-slash';
        }
      } else {
        // If using text content
        toggleButton.textContent = type === 'password' ? 'Show' : 'Hide';
      }
    });
  } else {
    // Create and add the toggle button if it doesn't exist
    if (passwordInput && !toggleButton) {
      console.log('Creating password toggle button');
      
      // Create container if needed
      let container = passwordInput.parentElement;
      if (!container.classList.contains('password-container')) {
        const newContainer = document.createElement('div');
        newContainer.className = 'password-container';
        passwordInput.parentNode.insertBefore(newContainer, passwordInput);
        newContainer.appendChild(passwordInput);
        container = newContainer;
      }
      
      // Create toggle button
      const newToggle = document.createElement('button');
      newToggle.type = 'button';
      newToggle.className = 'password-toggle';
      newToggle.innerHTML = '<i class="fas fa-eye"></i>';
      container.appendChild(newToggle);
      
      // Add event listener
      newToggle.addEventListener('click', function(e) {
        e.preventDefault();
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        console.log('Password visibility toggled to:', type);
        
        if (type === 'password') {
          newToggle.innerHTML = '<i class="fas fa-eye"></i>';
        } else {
          newToggle.innerHTML = '<i class="fas fa-eye-slash"></i>';
        }
      });
    } else {
      console.error('Password input not found');
    }
  }
}

function setupThemeToggle() {
  // Check for existing moon/sun icons
  const existingMoonIcons = document.querySelectorAll('.icon-moon');
  const existingSunIcons = document.querySelectorAll('.icon-sun');
  
  console.log('Found existing icons:', {
    moonIcons: existingMoonIcons.length,
    sunIcons: existingSunIcons.length
  });
  
  // If we already have moon/sun icons, use those instead of creating new ones
  if (existingMoonIcons.length > 0 || existingSunIcons.length > 0) {
    // Get saved theme
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    // Apply theme immediately
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    
    // Handle visibility of existing icons based on theme
    existingMoonIcons.forEach(icon => {
      // In dark mode, show moon icon
      icon.style.display = shouldBeDark ? 'inline-block' : 'none';
      
      // Add click handler if not already present
      if (!icon.hasThemeClickHandler) {
        icon.hasThemeClickHandler = true;
        icon.style.cursor = 'pointer';
        icon.addEventListener('click', toggleTheme);
      }
    });
    
    existingSunIcons.forEach(icon => {
      // In light mode, show sun icon
      icon.style.display = !shouldBeDark ? 'inline-block' : 'none';
      
      // Add click handler if not already present
      if (!icon.hasThemeClickHandler) {
        icon.hasThemeClickHandler = true;
        icon.style.cursor = 'pointer';
        icon.addEventListener('click', toggleTheme);
      }
    });
    
    console.log('Using existing theme icons');
    return; // Exit early, don't create new toggle button
  }
  
  // Rest of the existing function for creating a new toggle if needed
  // (This part will only run if no existing icons were found)
  
  // Try different possible selectors
  const themeToggle = document.getElementById('themeToggle') || 
                      document.querySelector('.theme-toggle');
  
  // Check if there are separate sun/moon icons
  const sunIcon = document.getElementById('sunIcon');
  const moonIcon = document.getElementById('moonIcon');
  
  console.log('Theme elements found:', { 
    themeToggle: themeToggle ? true : false,
    sunIcon: sunIcon ? true : false,
    moonIcon: moonIcon ? true : false
  });
  
  // Get saved theme
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
  
  // Apply theme immediately
  if (shouldBeDark) {
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
  }
  
  // Handle separate sun/moon icons
  if (sunIcon && moonIcon) {
    if (shouldBeDark) {
      sunIcon.style.display = 'block';
      moonIcon.style.display = 'none';
    } else {
      sunIcon.style.display = 'none';
      moonIcon.style.display = 'block';
    }
    
    // Add click handlers to both icons
    sunIcon.addEventListener('click', toggleTheme);
    moonIcon.addEventListener('click', toggleTheme);
    
    console.log('Theme toggled to', shouldBeDark ? 'dark' : 'light', 'mode, sunIcon hidden:', !shouldBeDark, 'moonIcon hidden:', shouldBeDark);
  } 
  // Handle single toggle button
  else if (themeToggle) {
    if (shouldBeDark) {
      themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
      themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
    
    themeToggle.addEventListener('click', toggleTheme);
  } 
  // Create toggle if it doesn't exist
  else {
    console.log('Creating theme toggle button');
    
    const newToggle = document.createElement('button');
    newToggle.id = 'themeToggle';
    newToggle.className = 'theme-toggle';
    newToggle.innerHTML = shouldBeDark ? 
      '<i class="fas fa-sun"></i>' : 
      '<i class="fas fa-moon"></i>';
    
    document.body.appendChild(newToggle);
    newToggle.addEventListener('click', toggleTheme);
  }
  
  // Theme toggle function
  function toggleTheme() {
    const isDark = document.documentElement.classList.contains('dark');
    
    if (isDark) {
      // Switch to light
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      
      // Handle existing icons
      document.querySelectorAll('.icon-moon').forEach(icon => {
        icon.style.display = 'none';
      });
      document.querySelectorAll('.icon-sun').forEach(icon => {
        icon.style.display = 'inline-block';
      });
      
      // Handle toggle button if it exists
      const themeToggle = document.getElementById('themeToggle');
      if (themeToggle) {
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
      }
      
      console.log('Theme toggled to light mode');
    } else {
      // Switch to dark
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      
      // Handle existing icons
      document.querySelectorAll('.icon-moon').forEach(icon => {
        icon.style.display = 'inline-block';
      });
      document.querySelectorAll('.icon-sun').forEach(icon => {
        icon.style.display = 'none';
      });
      
      // Handle toggle button if it exists
      const themeToggle = document.getElementById('themeToggle');
      if (themeToggle) {
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
      }
      
      console.log('Theme toggled to dark mode');
    }
    
    // Trigger custom event for other components that might need to update
    const event = new CustomEvent('themeChanged', { detail: { isDark: !isDark } });
    document.dispatchEvent(event);
  }
}

// Update the removeMetaMaskLinkingElements function to completely remove elements
function removeMetaMaskLinkingElements() {
  // Find and remove elements by text content
  document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div').forEach(element => {
    if (element.textContent.includes('Need to link your National ID to MetaMask?')) {
      console.log('Completely removing MetaMask text element:', element);
      element.remove(); // Completely remove instead of hiding
    }
  });
  
  // Find and remove the button by text content
  document.querySelectorAll('button, a').forEach(element => {
    if (element.textContent.includes('Link National ID to MetaMask Wallet')) {
      console.log('Completely removing MetaMask link button:', element);
      element.remove(); // Completely remove instead of hiding
    }
  });
  
  // Also try to find by likely IDs or classes
  const possibleIds = [
    'metamask-link', 
    'link-metamask', 
    'wallet-link', 
    'metamask-section',
    'wallet-section'
  ];
  
  possibleIds.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      console.log(`Completely removing element with ID ${id}:`, element);
      element.remove(); // Completely remove instead of hiding
    }
  });
  
  // Also try to remove by class names
  const possibleClasses = [
    'metamask-container',
    'wallet-container',
    'metamask-link-container',
    'wallet-link-section'
  ];
  
  possibleClasses.forEach(className => {
    document.querySelectorAll(`.${className}`).forEach(element => {
      console.log(`Completely removing element with class ${className}:`, element);
      element.remove();
    });
  });
  
  // Look for parent containers that might contain these elements
  document.querySelectorAll('.login-options, .additional-options, .wallet-options').forEach(container => {
    if (container.textContent.includes('MetaMask') || container.textContent.includes('Wallet')) {
      console.log('Checking container for MetaMask elements:', container);
      // Only remove the MetaMask-related children, not the entire container
      Array.from(container.children).forEach(child => {
        if (child.textContent.includes('MetaMask') || child.textContent.includes('Wallet')) {
          console.log('Removing child element:', child);
          child.remove();
        }
      });
    }
  });
}

document.addEventListener('DOMContentLoaded', function() {
  setupPasswordToggle();
  setupThemeToggle();
  removeMetaMaskLinkingElements();
  
  // Your existing code...
}); 