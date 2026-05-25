// Client-side JavaScript for Landing Page Leaderboard Preview

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
    initLandingLeaderboard();
});

async function initLandingLeaderboard() {
    const podiumContainer = document.getElementById('landingPodiumContainer');
    const tableBody = document.getElementById('landingLeaderboardBody');
    
    try {
        const response = await fetch('/api/leaderboard');
        const data = await response.json();

        if (data.success) {
            let allData = data.leaderboard || [];
            
            // Calculate points: 1 minute = 1 point, plus 10 points per completed session
            allData = allData.map(item => ({
                ...item,
                points: Math.floor(item.total_minutes || 0) + (item.total_sessions * 10)
            })).sort((a, b) => b.points - a.points);

            // 1. Display Top 3 Podium
            displayPodium(allData.slice(0, 3));

            // 2. Display Ranks 4-10 List
            displayRestOfTop10(allData.slice(3, 10));
        } else {
            console.error('Failed to load leaderboard data:', data.message);
            showErrorState();
        }
    } catch (error) {
        console.error('Error fetching leaderboard for landing page:', error);
        showErrorState();
    }
}

function displayPodium(top3) {
    const container = document.getElementById('landingPodiumContainer');
    if (!container) return;

    const placeholders = [
        { firstname: 'N/A', lastname: '', points: 0, photo: './images/defaultpfp.jpg' },
        { firstname: 'N/A', lastname: '', points: 0, photo: './images/defaultpfp.jpg' },
        { firstname: 'N/A', lastname: '', points: 0, photo: './images/defaultpfp.jpg' }
    ];

    // Rearrange to Podium Layout: 2nd place, 1st place, 3rd place from left to right
    const podium = [
        top3[1] || placeholders[1], // Second
        top3[0] || placeholders[0], // First
        top3[2] || placeholders[2]  // Third
    ];

    let html = '';
    podium.forEach((item, index) => {
        // Map visual index to actual rank
        // Visual index: 0 = 2nd Place, 1 = 1st Place, 2 = 3rd Place
        const rankClass = index === 1 ? 'first' : (index === 0 ? 'second' : 'third');
        const rankNum = index === 1 ? 1 : (index === 0 ? 2 : 3);
        const name = item.firstname !== 'N/A' 
            ? formatStudentName(item.firstname, item.middlename, item.lastname, 'initial') 
            : 'Empty';
        const points = item.points || 0;
        const photoUrl = item.photo || './images/defaultpfp.jpg';

        // Add distinct icons for visual polish
        let crown = '';
        if (rankNum === 1) crown = '<div class="crown-icon"><i class="fa-solid fa-crown"></i></div>';

        html += `
            <div class="podium-item ${rankClass} animate__animated animate__fadeInUp" style="animation-delay: ${index * 0.15}s">
                ${crown}
                <div class="avatar">
                    <img src="${photoUrl}" alt="${name}" onerror="this.onerror=null; this.src='./images/defaultpfp.jpg';" />
                </div>
                <div class="podium-rank-badge">${rankNum}</div>
                <div class="podium-name">${name}</div>
                <div class="podium-points">${points} <span class="pts-label">pts</span></div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function displayRestOfTop10(rest) {
    const tbody = document.getElementById('landingLeaderboardBody');
    if (!tbody) return;

    if (rest.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="no-rankings">No other rankings available yet</td>
            </tr>
        `;
        return;
    }

    let html = '';
    rest.forEach((student, index) => {
        const rank = index + 4; // Since we sliced from index 3 (which is 4th place)
        const name = formatStudentName(student.firstname, student.middlename, student.lastname, 'initial');
        const course = student.course || 'N/A';
        const points = student.points || 0;
        const photoUrl = student.photo || './images/defaultpfp.jpg';

        html += `
            <tr class="rank-row">
                <td class="rank-cell">
                    <span class="rank-number">${rank}</span>
                </td>
                <td class="student-cell">
                    <div class="student-info">
                        <img class="student-avatar" src="${photoUrl}" alt="${name}" onerror="this.onerror=null; this.src='./images/defaultpfp.jpg';" />
                        <span class="student-name">${name}</span>
                    </div>
                </td>
                <td class="course-cell">${course}</td>
                <td class="points-cell"><strong>${points}</strong> <span class="pts-sub">pts</span></td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

function showErrorState() {
    const podiumContainer = document.getElementById('landingPodiumContainer');
    const tableBody = document.getElementById('landingLeaderboardBody');

    if (podiumContainer) {
        podiumContainer.innerHTML = '<div class="error-msg"><i class="fa-solid fa-circle-exclamation"></i> Unable to load top performers</div>';
    }
    if (tableBody) {
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center error-msg">Unable to load rankings at this time.</td></tr>';
    }
}
