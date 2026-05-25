// Client-side JavaScript for profile page

function formatStudentName(firstname, middlename, lastname, type = 'full') {
  const first = (firstname || '').trim();
  const last = (lastname || '').trim();
  const middle = (middlename || '').trim();
  
  if (!middle || middle.toUpperCase() === 'N/A') {
    return `${first} ${last}`.trim();
  }
  
  if (type === 'initial') {
    const initial = middle.charAt(0).toUpperCase();
    return `${first} ${initial}. ${last}`.trim();
  }
  
  return `${first} ${middle} ${last}`.trim();
}

document.addEventListener('DOMContentLoaded', function() {
  // Check if user is logged in (by checking localStorage)
  const userData = localStorage.getItem('userData');
  const authToken = localStorage.getItem('authToken');
  
  if (!userData && !authToken) {
    // Redirect to login if not authenticated
    window.location.href = 'Login.html';
    return;
  }

  // Navigation, notifications, and logout are now handled entirely by nav-logic.js
  
  // Load user data from localStorage
  loadUserData();

  // Load announcements
  loadAnnouncements();

  // Setup change photo button - now handled by edit profile modal
  setupChangePhotoButton();

  // Setup edit profile modal
  setupEditProfileModal();

  // Load dynamic dropdowns
  loadDropdowns();
});

// Check if user is authenticated
function isAuthenticated() {
  return localStorage.getItem('authToken') !== null || localStorage.getItem('userData') !== null;
}

// Load user data from localStorage or server
async function loadUserData() {
  const token = localStorage.getItem('authToken');
  const cachedUserData = localStorage.getItem('userData');
  
  // Try to fetch fresh data from server
  if (token) {
    try {
      const response = await fetch('/api/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          // Update localStorage with fresh data
          const user = data.user;
          localStorage.setItem('userData', JSON.stringify(user));
          
          // Update student information
          document.getElementById('studentName').textContent = formatStudentName(user.firstname, user.middlename, user.lastname, 'full');
          document.getElementById('studentCourse').textContent = user.course || 'N/A';
          document.getElementById('studentYear').textContent = user.courseLevel || 'N/A';
          document.getElementById('studentEmail').textContent = user.email || 'N/A';
          document.getElementById('studentAddress').textContent = user.address || 'N/A';
          
          // Set sessions from user data
          document.getElementById('studentSessions').textContent = user.sessions || 30;
          
          // Set profile photo if available
          if (user.photo) {
            document.getElementById('profileImage').src = user.photo;
          } else {
            document.getElementById('profileImage').src = './images/defaultpfp.jpg';
          }
          return;
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }
  
  // Fallback to cached data
  if (cachedUserData) {
    const user = JSON.parse(cachedUserData);
    
    // Update student information
    document.getElementById('studentName').textContent = formatStudentName(user.firstname, user.middlename, user.lastname, 'full') || 'Guest User';
    document.getElementById('studentCourse').textContent = user.course || 'N/A';
    document.getElementById('studentYear').textContent = user.courseLevel || 'N/A';
    document.getElementById('studentEmail').textContent = user.email || 'N/A';
    document.getElementById('studentAddress').textContent = user.address || 'N/A';
    
    // Set sessions from user data
    document.getElementById('studentSessions').textContent = user.sessions || 30;
    
    // Set profile photo if available
    if (user.photo) {
      document.getElementById('profileImage').src = user.photo;
    } else {
      document.getElementById('profileImage').src = './images/defaultpfp.jpg';
    }
  } else {
    // If no user data, show placeholder
    document.getElementById('studentName').textContent = 'Guest User';
    document.getElementById('studentCourse').textContent = 'N/A';
    document.getElementById('studentYear').textContent = 'N/A';
    document.getElementById('studentEmail').textContent = 'N/A';
    document.getElementById('studentAddress').textContent = 'N/A';
    document.getElementById('studentSessions').textContent = 30;
    document.getElementById('profileImage').src = './images/defaultpfp.jpg';
  }
}

// Load announcements from server
async function loadAnnouncements() {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/announcements', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      displayAnnouncements(data.announcements || []);
    } else {
      console.error('Error loading announcements:', data.message);
      displayAnnouncements([]);
    }
  } catch (error) {
    console.error('Error loading announcements:', error);
    displayAnnouncements([]);
  }
}

// Display announcements on profile page
function displayAnnouncements(announcements) {
  const announcementContent = document.getElementById('announcementContainer');
  
  if (!announcementContent) return;
  
  if (announcements.length === 0) {
    announcementContent.innerHTML = '<div class="announcement-item"><div class="announcement-line">No announcements yet</div></div>';
    return;
  }
  
  let html = '';
  announcements.forEach(announcement => {
    // Format date as CCS Admin | 2026-Mar-17
    const date = new Date(announcement.created_at);
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    html += `
      <div class="announcement-item">
        <div class="announcement-line">CCS Admin | ${formattedDate}</div>
        <div class="announcement-message">${escapeHtml(announcement.content)}</div>
      </div>
    `;
  });
  
  announcementContent.innerHTML = html;
}



// Setup change photo button - now handled by edit profile modal
function setupChangePhotoButton() {
  // Photo can only be changed in edit profile modal
}

// Setup edit profile modal
function setupEditProfileModal() {
  const editProfileLink = document.querySelector('a[href="#editprofile"]');
  const modal = document.getElementById('editProfileModal');
  const closeBtn = document.getElementById('closeModalBtn');
  const cancelBtn = document.getElementById('cancelEditBtn');
  const form = document.getElementById('editProfileForm');
  const editPhotoInput = document.getElementById('editPhotoInput');

  if (!modal) return;

  // Open modal when Edit Profile is clicked
  if (editProfileLink) {
    editProfileLink.addEventListener('click', function(e) {
      e.preventDefault();
      openEditModal();
    });
  }

  // Close modal
  if (closeBtn) {
    closeBtn.addEventListener('click', closeEditModal);
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeEditModal);
  }

  // Close modal when clicking outside
  window.addEventListener('click', function(e) {
    if (e.target === modal) {
      closeEditModal();
    }
  });

  // Handle photo change
  if (editPhotoInput) {
    editPhotoInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          document.getElementById('editProfileImage').src = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Handle remove photo
  const removePhotoBtn = document.getElementById('removePhotoBtn');
  if (removePhotoBtn) {
    removePhotoBtn.addEventListener('click', function() {
      document.getElementById('editProfileImage').src = './images/defaultpfp.jpg';
      if (editPhotoInput) {
        editPhotoInput.value = '';
      }
    });
  }

  // Handle form submission
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      await saveProfile();
    });
  }
}

// Open edit profile modal and load user data
function openEditModal() {
  const modal = document.getElementById('editProfileModal');
  
  // Get current user data from localStorage
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  
  // Populate form fields
  document.getElementById('editFirstname').value = userData.firstname || '';
  document.getElementById('editLastname').value = userData.lastname || '';
  document.getElementById('editMiddlename').value = userData.middlename || '';
  document.getElementById('editCourse').value = userData.course || 'BSIT';
  document.getElementById('editCourseLevel').value = userData.courseLevel || '1st Year';
  document.getElementById('editEmail').value = userData.email || '';
  document.getElementById('editAddress').value = userData.address || '';
  
  // Set profile photo
  const profileImage = userData.photo || './images/defaultpfp.jpg';
  document.getElementById('editProfileImage').src = profileImage;
  
  // Show modal
  if (modal) {
    modal.classList.add('show');
  }
}

// Close edit profile modal
function closeEditModal() {
  const modal = document.getElementById('editProfileModal');
  if (modal) {
    modal.classList.remove('show');
  }
}

// Save profile changes
async function saveProfile() {
  const token = localStorage.getItem('authToken');
  
  // Get photo data
  const profileImage = document.getElementById('editProfileImage');
  const photoData = profileImage.src;
  
  const userData = {
    firstname: document.getElementById('editFirstname').value,
    lastname: document.getElementById('editLastname').value,
    middlename: document.getElementById('editMiddlename').value,
    course: document.getElementById('editCourse').value,
    courseLevel: document.getElementById('editCourseLevel').value,
    email: document.getElementById('editEmail').value,
    address: document.getElementById('editAddress').value,
    photo: photoData
  };

  console.log('Saving profile data:', userData);

  try {
    const response = await fetch('/api/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(userData)
    });

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server not responding. Please restart the server with "node server.js" and try again.');
    }

    const data = await response.json();
    console.log('Response:', data);

    if (data.success) {
      // Update localStorage with new user data
      const storedUserData = JSON.parse(localStorage.getItem('userData') || '{}');
      const updatedUserData = { ...storedUserData, ...userData };
      localStorage.setItem('userData', JSON.stringify(updatedUserData));

      // Update displayed user info
      document.getElementById('studentName').textContent = formatStudentName(userData.firstname, userData.middlename, userData.lastname, 'full');
      document.getElementById('studentCourse').textContent = userData.course;
      document.getElementById('studentYear').textContent = userData.courseLevel;
      document.getElementById('studentEmail').textContent = userData.email;
      document.getElementById('studentAddress').textContent = userData.address;
      document.getElementById('profileImage').src = photoData;

      alert('Profile updated successfully!');
      closeEditModal();
    } else {
      alert(data.message || 'Failed to update profile');
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    alert('Unable to update profile. Please try again. Error: ' + error.message);
  }
}

// Load dynamic dropdowns from server
async function loadDropdowns() {
  try {
    // Fetch active courses
    const courseRes = await fetch('/api/dropdowns/course');
    const courseData = await courseRes.json();
    if (courseData.success) {
      updateSelectElement('editCourse', courseData.options, 'Select Course');
    }
    
    // Fetch active course levels (year levels)
    const levelRes = await fetch('/api/dropdowns/year_level');
    const levelData = await levelRes.json();
    if (levelData.success) {
      updateSelectElement('editCourseLevel', levelData.options, 'Select Year Level');
    }
  } catch (error) {
    console.error('Error loading dropdowns:', error);
  }
}

function updateSelectElement(elementId, options, defaultText) {
  const select = document.getElementById(elementId);
  if (!select) return;
  
  const currentValue = select.value;
  let html = `<option value="">${defaultText}</option>`;
  
  options.forEach(opt => {
    const selected = opt.value === currentValue ? 'selected' : '';
    html += `<option value="${escapeHtml(opt.value)}" ${selected}>${escapeHtml(opt.value)}</option>`;
  });
  
  select.innerHTML = html;
}
