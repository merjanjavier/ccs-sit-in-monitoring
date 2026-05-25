// Client-side JavaScript for leaderboard page

function formatStudentName(firstname, middlename, lastname, type = 'initial') {
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
    // Check if user is logged in
    const userData = localStorage.getItem('userData');
    const authToken = localStorage.getItem('authToken');
    
    if (!userData && !authToken) {
        window.location.href = 'Login.html';
        return;
    }

    // Initialize page
    initLeaderboard();

    // Setup search
    const searchInput = document.getElementById('leaderboardSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            filterLeaderboard(e.target.value);
        });
    }
});

let allLeaderboardData = [];

async function initLeaderboard() {
    console.log('Initializing leaderboard...');
    try {
        const response = await fetch('/api/leaderboard');
        console.log('Leaderboard response status:', response.status);
        const data = await response.json();
        console.log('Leaderboard data received:', data);

        if (data.success) {
            allLeaderboardData = data.leaderboard || [];
            console.log('Processing', allLeaderboardData.length, 'students');
            
            // 1. Process data (calculate points: 1 min = 1 pt)
            allLeaderboardData = allLeaderboardData.map(item => ({
                ...item,
                points: Math.floor(item.total_minutes || 0) + (item.total_sessions * 10)
            })).sort((a, b) => b.points - a.points);

            // 2. Display Top 3
            displayTopPerformers(allLeaderboardData.slice(0, 3));

            // 3. Display Full Table
            displayFullLeaderboard(allLeaderboardData);

            // 4. Update "My Performance"
            updateMyPerformance(allLeaderboardData);
        } else {
            console.error('Leaderboard data error:', data.message);
            displayFullLeaderboard([]);
        }
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        displayFullLeaderboard([]);
    }
}

function displayTopPerformers(top3) {
    const container = document.getElementById('topPerformersContainer');
    if (!container) return;

    // We expect 3 items, handle cases with fewer
    const placeholders = [
        { name: 'N/A', points: 0, rank: 1, class: 'first' },
        { name: 'N/A', points: 0, rank: 2, class: 'second' },
        { name: 'N/A', points: 0, rank: 3, class: 'third' }
    ];

    const podium = [
        top3[1] || placeholders[1], // Second
        top3[0] || placeholders[0], // First
        top3[2] || placeholders[2]  // Third
    ];

    let html = '';
    podium.forEach((item, index) => {
        const rankClass = index === 1 ? 'first' : (index === 0 ? 'second' : 'third');
        const rankNum = index === 1 ? 1 : (index === 0 ? 2 : 3);
        const name = item.firstname ? formatStudentName(item.firstname, item.middlename, item.lastname, 'initial') : 'Empty';
        const points = item.points || 0;
        const photoUrl = item.photo || './images/defaultpfp.jpg';

        html += `
            <div class="podium-item ${rankClass} animate__animated animate__fadeInUp" style="animation-delay: ${index * 0.2}s">
                <div class="avatar" style="overflow: hidden; display: flex; align-items: center; justify-content: center; background: #e2e8f0;">
                    <img src="${photoUrl}" alt="${name}" onerror="this.onerror=null; this.src='./images/defaultpfp.jpg';" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%; display: block;" />
                </div>
                <div class="podium-rank">${rankNum}</div>
                <div class="podium-name">${name}</div>
                <div class="podium-points">${points} pts</div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function displayFullLeaderboard(data) {
    const tbody = document.getElementById('leaderboardTableBody');
    if (!tbody) return;

    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const myId = userData.id;

    let html = '';
    data.forEach((student, index) => {
        const rank = index + 1;
        const name = formatStudentName(student.firstname, student.middlename, student.lastname, 'initial');
        const courseYear = `${student.course} - ${student.course_level}`;
        const hours = Math.floor(student.total_minutes / 60);
        const mins = Math.floor(student.total_minutes % 60);
        const timeStr = `${hours}h ${mins}m`;
        const isMeClass = student.id == myId ? 'my-rank' : '';
        
        let rankBadge = `<span class="rank-badge">${rank}</span>`;
        if (rank === 1) rankBadge = `<span class="rank-badge rank-1">1</span>`;
        if (rank === 2) rankBadge = `<span class="rank-badge rank-2">2</span>`;
        if (rank === 3) rankBadge = `<span class="rank-badge rank-3">3</span>`;

        html += `
            <tr class="${isMeClass}">
                <td>${rankBadge}</td>
                <td>${name}</td>
                <td>${courseYear}</td>
                <td>${student.total_sessions}</td>
                <td>${timeStr}</td>
                <td><strong>${student.points}</strong></td>
            </tr>
        `;
    });

    tbody.innerHTML = html || '<tr><td colspan="6" style="text-align: center;">No data found</td></tr>';
}

function updateMyPerformance(data) {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const myId = userData.id;
    
    const myIndex = data.findIndex(item => item.id == myId);
    
    if (myIndex !== -1) {
        const me = data[myIndex];
        const hours = Math.floor(me.total_minutes / 60);
        const mins = Math.floor(me.total_minutes % 60);

        document.getElementById('myRank').textContent = `#${myIndex + 1}`;
        document.getElementById('myPoints').textContent = me.points;
        document.getElementById('myTime').textContent = `${hours}h ${mins}m`;
    }
}

function filterLeaderboard(searchTerm) {
    const term = searchTerm.toLowerCase();
    const filtered = allLeaderboardData.filter(student => 
        formatStudentName(student.firstname, student.middlename, student.lastname, 'initial').toLowerCase().includes(term) ||
        student.id_number.toString().includes(term)
    );
    displayFullLeaderboard(filtered);
}


