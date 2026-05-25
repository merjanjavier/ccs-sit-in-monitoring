// Client-side JavaScript for registration

document.addEventListener('DOMContentLoaded', function() {
  const registerForms = document.querySelectorAll('.Register form');
  const registerButton = document.querySelector('.Register .btn button');

  if (registerButton) {
    registerButton.addEventListener('click', handleRegister);
  }

  // Also handle form submission with Enter key on all forms in the section
  registerForms.forEach(form => {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      handleRegister();
    });
  });

  // Mobile menu toggle
  const menuToggle = document.querySelector('.mobile-menu-toggle');
  const links = document.querySelector('.links');
  if (menuToggle && links) {
    menuToggle.addEventListener('click', function() {
      links.classList.toggle('active');
    });
  }

  // Load dynamic dropdowns
  loadDropdowns();

  // Live Password Validation
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const passwordFeedback = document.getElementById('passwordFeedback');
  const confirmPasswordFeedback = document.getElementById('confirmPasswordFeedback');

  function validatePasswords() {
    const password = passwordInput ? passwordInput.value : '';
    const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';

    // Validate main password
    if (passwordInput && passwordFeedback) {
      if (password.length === 0) {
        passwordFeedback.textContent = '';
      } else if (password.length < 6) {
        passwordFeedback.innerHTML = '❌ Password must be at least 6 characters';
        passwordFeedback.style.color = '#dc3545';
      } else {
        passwordFeedback.innerHTML = '✅ Password is valid';
        passwordFeedback.style.color = '#28a745';
      }
    }

    // Validate confirmation matching
    if (confirmPasswordInput && confirmPasswordFeedback) {
      if (confirmPassword.length === 0) {
        confirmPasswordFeedback.textContent = '';
      } else if (password !== confirmPassword) {
        confirmPasswordFeedback.innerHTML = '❌ Passwords do not match';
        confirmPasswordFeedback.style.color = '#dc3545';
      } else {
        confirmPasswordFeedback.innerHTML = '✅ Passwords match';
        confirmPasswordFeedback.style.color = '#28a745';
      }
    }
  }

  if (passwordInput) {
    passwordInput.addEventListener('input', validatePasswords);
  }
  if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener('input', validatePasswords);
  }

  // Handle No Middle Name Checkbox Behavior
  const middlenameInput = document.getElementById('middlename');
  const noMiddleNameCheckbox = document.getElementById('noMiddleNameCheckbox');
  if (noMiddleNameCheckbox && middlenameInput) {
    noMiddleNameCheckbox.addEventListener('change', function() {
      if (this.checked) {
        middlenameInput.value = 'N/A';
        middlenameInput.readOnly = true;
      } else {
        middlenameInput.value = '';
        middlenameInput.readOnly = false;
      }
    });
  }
});

async function handleRegister() {
  // Get form values
  const idNumber = document.getElementById('number').value.trim();
  const lastname = document.getElementById('lastname').value.trim();
  const firstname = document.getElementById('firstname').value.trim();
  const middlename = document.getElementById('middlename').value.trim();
  const courseLevel = document.getElementById('courselevel').value;
  const course = document.getElementById('course').value;
  const address = document.getElementById('address').value.trim();
  const email = document.getElementById('email').value.trim();
  
  // Get both password fields
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  // Validation
  if (!idNumber || !lastname || !firstname || !courseLevel || !course || !address || !email || !password || !confirmPassword) {
    alert('Please fill in all required fields');
    return;
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert('Please enter a valid email address');
    return;
  }

  // Password validation
  if (password.length < 6) {
    alert('Password must be at least 6 characters long');
    return;
  }

  if (password !== confirmPassword) {
    alert('Passwords do not match');
    return;
  }

  // Prepare data
  const userData = {
    idNumber,
    lastname,
    firstname,
    middlename,
    courseLevel,
    course,
    address,
    email,
    password,
    confirmPassword
  };

  try {
    // Show loading state
    const registerButton = document.querySelector('.Register .btn button');
    const originalText = registerButton.textContent;
    registerButton.textContent = 'Registering...';
    registerButton.disabled = true;

    // Send registration request
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    const data = await response.json();

    // Reset button state
    registerButton.textContent = originalText;
    registerButton.disabled = false;

    if (data.success) {
      // Show success message and redirect
      alert('Registration successful! You can now login.');
      window.location.href = 'Login.html';
    } else {
      alert(data.message || 'Registration failed. Please try again.');
    }

  } catch (error) {
    console.error('Registration error:', error);
    alert('Unable to connect to server. Please make sure the server is running.');
    
    // Reset button state
    const registerButton = document.querySelector('.Register .btn button');
    registerButton.textContent = 'Register';
    registerButton.disabled = false;
  }
}

// Load dynamic dropdowns from server
async function loadDropdowns() {
  try {
    // Fetch active courses
    const courseRes = await fetch('/api/dropdowns/course');
    const courseData = await courseRes.json();
    if (courseData.success) {
      updateSelectElement('course', courseData.options, 'Select Course');
    }
    
    // Fetch active course levels (year levels)
    const levelRes = await fetch('/api/dropdowns/year_level');
    const levelData = await levelRes.json();
    if (levelData.success) {
      updateSelectElement('courselevel', levelData.options, 'Select Course Level');
    }
  } catch (error) {
    console.error('Error loading dropdowns:', error);
  }
}

function updateSelectElement(elementId, options, defaultText) {
  const select = document.getElementById(elementId);
  if (!select) return;
  
  let html = `<option value="" disabled selected>${defaultText}</option>`;
  
  options.forEach(opt => {
    html += `<option value="${escapeHtml(opt.value)}">${escapeHtml(opt.value)}</option>`;
  });
  
  select.innerHTML = html;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
