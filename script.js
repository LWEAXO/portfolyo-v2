const GITHUB_USERNAME = "LWEAXO"; // GitHub kullanıcı adınız
const DISCORD_USER_ID = "1015356240492245054"; // Discord ID'niz



document.addEventListener('DOMContentLoaded', function() {
    
    initializePage();
    loadGitHubProfile(GITHUB_USERNAME);
    
    if (DISCORD_USER_ID && DISCORD_USER_ID !== "YOUR_DISCORD_ID") {
        fetchDiscordActivities(DISCORD_USER_ID);
        setInterval(() => fetchDiscordActivities(DISCORD_USER_ID), 15000);
    } else {
        showNoActivities("Discord ID girilmedi");
    }
    
    loadProjects(GITHUB_USERNAME);
});

function initializePage() {
    // Varsayılan olarak projeler sekmesini aktif yap
    document.querySelector('[data-tab="projects"]').classList.add('active');
    document.getElementById('projects').classList.add('active');
    document.querySelector('.content-header h1').textContent = "Projeler";

    loadSkills();
    // Sekme yönetimi
    setupTabNavigation();
    
    // Tema değiştirme butonu
    setupThemeToggle();
    
    // Görünüm seçenekleri
    setupViewOptions();
}

function setupTabNavigation() {
    const tabs = document.querySelectorAll('.nav-link');
    tabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            
            document.querySelectorAll('.nav-link').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
            document.querySelector('.content-header h1').textContent = this.querySelector('span').textContent;
        });
    });
}

function setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        this.querySelector('i').className = newTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
        localStorage.setItem('theme', newTheme);
    });

    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggle.querySelector('i').className = savedTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
}

function setupViewOptions() {
    const viewOptions = document.querySelectorAll('.view-option');
    viewOptions.forEach(option => {
        option.addEventListener('click', function() {
            viewOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            document.querySelector('.projects-grid').classList.toggle('list-view', this.querySelector('i').classList.contains('fa-list'));
        });
    });
}

async function loadGitHubProfile(username) {
    try {
        const response = await fetch(`https://api.github.com/users/${username}`);
        if (!response.ok) throw new Error('Profil bilgileri alınamadı');
        
        const profile = await response.json();
        
        // Profil bilgilerini güncelle
        updateProfileInfo(profile);
        
        // GitHub bağlantılarını güncelle
        updateProfileLinks(username, profile);
        
    } catch (error) {
        console.error('Profil bilgileri yüklenirken hata:', error);
        showProfileError();
    }
}

function updateProfileInfo(profile) {
    // Avatar ve kullanıcı bilgileri
    document.getElementById('profile-avatar').src = profile.avatar_url;
    document.getElementById('about-avatar').src = profile.avatar_url;
    document.getElementById('profile-username').textContent = profile.name || profile.login;
    
    // Hakkımda sekmesi bilgileri
    document.getElementById('about-name').textContent = `Merhaba, Ben ${profile.name || profile.login}`;
    document.getElementById('about-bio').textContent = profile.bio || 'Geliştirici';
    document.getElementById('about-description').textContent = profile.bio || 
        `GitHub profilimdeki projelerimi inceleyebilirsiniz. ${profile.public_repos} adet public repositorim bulunmaktadır.`;
    
    // Ekstra bilgiler (isteğe bağlı)
    if (profile.location) {
        const locationElement = document.createElement('p');
        locationElement.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${profile.location}`;
        document.querySelector('.about-content').appendChild(locationElement);
    }
}

function updateProfileLinks(username, profile) {
    const githubLink = document.getElementById('github-profile-link');
    githubLink.href = profile.html_url;
}

function showProfileError() {
    document.getElementById('profile-username').textContent = "Yüklenemedi";
    document.getElementById('about-description').textContent = "Profil bilgileri yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.";
}

let activityIntervals = {};

function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
}

function formatPlayTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
    const s = Math.floor(seconds % 60).toString().padStart(2, "0");
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
}

function sanitizeActivityId(id) {
    return id.replace(/[^a-zA-Z0-9-]/g, '-');
}

async function fetchDiscordActivities(userId) {
    try {
        const res = await fetch(`https://api.lanyard.rest/v1/users/${userId}`);
        if (!res.ok) throw new Error("API error");
        
        const data = await res.json();
        if (!data.success) throw new Error("Data error");
        
        updateActivities(data.data.activities);
    } catch (err) {
        console.error("Aktiviteler yüklenirken hata:", err);
        showNoActivities("Aktiviteler yüklenirken hata oluştu");
    }
}

function updateActivities(activities) {
    const container = document.querySelector('.activity-container');
    
    // Clear existing intervals
    clearAllActivityIntervals();
    
    if (!activities || activities.length === 0) {
        showNoActivities("Şu anda aktif bir aktivite yok");
        return;
    }
    
    let html = '';
    const spotifyActivity = activities.find(a => a.type === 2);
    const gameActivities = activities.filter(a => a.type === 0);
    
    // Add Spotify activity if exists
    if (spotifyActivity) {
        html += createSpotifyCard(spotifyActivity);
        startSpotifyUpdates(spotifyActivity);
    }
    
    // Add game activities
    gameActivities.forEach(game => {
        html += createGameCard(game);
        startGameUpdates(game);
    });
    
    container.innerHTML = html || '<div class="no-activities"><p>Şu anda aktif bir aktivite yok</p></div>';
}

function createSpotifyCard(activity) {
    const start = activity.timestamps.start;
    const end = activity.timestamps.end;
    const elapsed = Math.floor((Date.now() - start) / 1000);
    const duration = Math.floor((end - start) / 1000);
    const progress = Math.min((elapsed / duration) * 100, 100);
    const album = getSpotifyImage(activity.assets?.large_image);
    const sanitizedId = sanitizeActivityId(activity.id);

    return `
        <div id="activity-${sanitizedId}" class="activity-card spotify">
            <div class="activity-icon"><i class="fab fa-spotify"></i></div>
            <div class="activity-content">
                <div class="song-info">
                    <div class="song-title">${activity.details || "Şarkı çalınıyor"}</div>
                    <div class="song-artist">${activity.state || "Bilinmeyen sanatçı"}</div>
                </div>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${progress}%"></div>
                    <div class="progress-dot" style="left: ${progress}%"></div>
                </div>
                <div class="song-timestamps">
                    <span>${formatTime(elapsed)}</span>
                    <span>${formatTime(duration)}</span>
                </div>
                ${album ? `
                <div class="album-art-wrapper">
                    <div class="album-art-container">
                        <img class="album-art" src="${album}" alt="Album Art" onerror="this.style.display='none'" />
                        <div class="music-bars">
                            <div class="bar"></div>
                            <div class="bar"></div>
                            <div class="bar"></div>
                            <div class="bar"></div>
                            <div class="bar"></div>
                        </div>
                    </div>
                </div>
                ` : ''}
            </div>
        </div>`;
}

function createGameCard(activity) {
    const start = activity.timestamps?.start;
    const elapsed = start ? Math.floor((Date.now() - start) / 1000) : null;
    const largeImage = getGameImage(activity.assets?.large_image);
    const sanitizedId = sanitizeActivityId(activity.id);

    return `
        <div id="activity-${sanitizedId}" class="activity-card game">
            <div class="activity-icon"><i class="fas fa-gamepad"></i></div>
            <div class="activity-content">
                <div class="activity-header"><div class="activity-name">${activity.name || "Oyun"}</div></div>
                <div class="game-details">
                    ${largeImage ? `
                        <div class="game-icon-container">
                            <img class="game-icon" src="${largeImage}" onerror="this.style.display='none'" />
                        </div>
                    ` : ''}
                    <div class="game-info">
                        <div class="game-title">${activity.details || "Oynuyor"}</div>
                        ${activity.state ? `<div class="game-state">${activity.state}</div>` : ''}
                        ${
                            elapsed !== null
                                ? `<div class="game-time"><i class="fas fa-clock"></i><span>${formatPlayTime(elapsed)}</span></div>`
                                : ""
                        }
                    </div>
                </div>
            </div>
        </div>`;
}

function getSpotifyImage(imageKey) {
    if (!imageKey) return null;
    if (imageKey.startsWith("spotify:")) {
        return `https://i.scdn.co/image/${imageKey.replace("spotify:", "")}`;
    }
    return `https://cdn.discordapp.com/app-assets/spotify/${imageKey}.png`;
}

function getGameImage(imageKey) {
    if (!imageKey) return null;
    
    // Handle external URLs
    if (imageKey.startsWith("mp:external/")) {
        const urlPart = imageKey.split("https/")[1];
        if (urlPart) return `https://${urlPart}`;
    }
    
    // Default Discord CDN
    return `https://cdn.discordapp.com/app-assets/383226320970055681/${imageKey}.png`;
}

(function() {
    let lastUpdate = 0;
    const camoUrl = 'https://camo.githubusercontent.com/0df8e667d6aefca04cf149708684a625ee1e045d1861cc84796f7acf5618fb9d/68747470733a2f2f6b6f6d617265762e636f6d2f67687076632f3f757365726e616d653d4c574541584f26636f6c6f723d726564';
    
    function refresh() {
        const now = Date.now();
        if (now - lastUpdate >= 2000) {
            new Image().src = `${camoUrl}?t=${now}`;
            lastUpdate = now;
        }
        requestAnimationFrame(refresh);
    }
    
    requestAnimationFrame(refresh);
})();

function startSpotifyUpdates(activity) {
    const start = activity.timestamps.start;
    const end = activity.timestamps.end;
    const sanitizedId = sanitizeActivityId(activity.id);
    
    updateSpotifyProgress(sanitizedId, start, end);
    activityIntervals[activity.id] = setInterval(() => {
        updateSpotifyProgress(sanitizedId, start, end);
    }, 1000);
}

function updateSpotifyProgress(id, start, end) {
    const card = document.querySelector(`#activity-${id}`);
    if (!card) {
        clearInterval(activityIntervals[id]);
        return;
    }

    const now = Date.now();
    const elapsed = Math.floor((now - start) / 1000);
    const duration = Math.floor((end - start) / 1000);
    const progress = Math.min((elapsed / duration) * 100, 100);

    const progressBar = card.querySelector(".progress-bar");
    const progressDot = card.querySelector(".progress-dot");
    const elapsedSpan = card.querySelector(".song-timestamps span:first-child");
    const durationSpan = card.querySelector(".song-timestamps span:last-child");

    if (progressBar) progressBar.style.width = `${progress}%`;
    if (progressDot) progressDot.style.left = `${progress}%`;
    if (elapsedSpan) elapsedSpan.textContent = formatTime(elapsed);
    if (durationSpan) durationSpan.textContent = formatTime(duration);

    if (elapsed >= duration) {
        clearInterval(activityIntervals[id]);
    }
}

function startGameUpdates(activity) {
    if (!activity.timestamps?.start) return;
    
    const start = activity.timestamps.start;
    const sanitizedId = sanitizeActivityId(activity.id);
    
    updateGameTime(sanitizedId, start);
    activityIntervals[activity.id] = setInterval(() => {
        updateGameTime(sanitizedId, start);
    }, 1000);
}

function updateGameTime(id, start) {
    const card = document.querySelector(`#activity-${id}`);
    const timeEl = card?.querySelector(".game-time span");
    if (timeEl) {
        const elapsed = Math.floor((Date.now() - start) / 1000);
        timeEl.textContent = formatPlayTime(elapsed);
    }
}

function clearAllActivityIntervals() {
    Object.values(activityIntervals).forEach(clearInterval);
    activityIntervals = {};
}

function showNoActivities(message = "Şu anda aktif bir aktivite yok") {
    document.querySelector('.activity-container').innerHTML = `
        <div class="no-activities">
            <p>${message}</p>
        </div>
    `;
}

async function loadProjects(username) {
    try {
        const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&direction=desc`);
        if (!response.ok) throw new Error('Projeler yüklenemedi');
        
        const projects = await response.json();
        const projectsGrid = document.querySelector('.projects-grid');
        
        projectsGrid.innerHTML = '';
        
        if (projects.length === 0) {
            projectsGrid.innerHTML = '<p class="no-projects">Henüz hiç proje bulunmamaktadır.</p>';
            return;
        }
        
        projects.forEach(project => {
            const projectCard = document.createElement('div');
            projectCard.className = 'project-card';
            
            const isDiscordLink = project.homepage && 
                                 (project.homepage.includes('discord.gg') || 
                                  project.homepage.includes('discord.com/invite'));
            
            projectCard.innerHTML = `
                <div class="project-image">
                    ${project.language ? `
                        <div class="language-badge" style="background-color: ${getLanguageColor(project.language)}">
                            ${project.language}
                        </div>` : ''
                    }
                    <i class="fab fa-github-alt"></i>
                </div>
                <div class="project-info">
                    <h3 class="project-title">${project.name}</h3>
                    <p class="project-description">${project.description || 'Açıklama bulunmamaktadır.'}</p>
                    
                    <div class="project-stats">
                        <span class="project-stat"><i class="fas fa-star"></i> ${project.stargazers_count}</span>
                        <span class="project-stat"><i class="fas fa-code-branch"></i> ${project.forks_count}</span>
                        <span class="project-stat"><i class="fas fa-calendar-alt"></i> ${formatDate(project.updated_at)}</span>
                    </div>
                    
                    <div class="project-links">
                        <a href="${project.html_url}" target="_blank" class="project-link">
                            <i class="fas fa-code"></i> Kod
                        </a>
                        ${project.homepage && !isDiscordLink ? `
                            <a href="${project.homepage}" target="_blank" class="project-link secondary">
                                <i class="fas fa-external-link-alt"></i> Demo
                            </a>` : ''
                        }
                        ${isDiscordLink ? `
                            <button class="discord-link" onclick="copyDiscordLink('${project.homepage}')">
                                <i class="fab fa-discord"></i> Discord
                            </button>` : ''
                        }
                    </div>
                </div>
            `;
            
            projectsGrid.appendChild(projectCard);
        });
        
    } catch (error) {
        console.error('Projeler yüklenirken hata:', error);
        document.querySelector('.projects-grid').innerHTML = `
            <p class="error-message">Projeler yüklenirken bir hata oluştu</p>
        `;
    }
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('tr-TR', options);
}

function getLanguageColor(language) {
    const colors = {
        'JavaScript': '#f1e05a',
        'TypeScript': '#3178c6',
        'Python': '#3572A5',
        'C++': '#f34b7d',
        'Java': '#b07219',
        'HTML': '#e34c26',
        'CSS': '#563d7c',
        'PHP': '#4F5D95',
        'Ruby': '#701516',
        'Go': '#00ADD8',
        'Swift': '#ffac45',
        'Kotlin': '#A97BFF'
    };
    return colors[language] || '#5865F2';
}

function copyDiscordLink(link) {
    navigator.clipboard.writeText(link).then(() => {
        alert('Discord linki panoya kopyalandı: ' + link);
    }).catch(err => {
        console.error('Kopyalama hatası:', err);
        window.open(link, '_blank');
    });
}

function loadSkills() {
    const skills = [
        { name: "Python", icon: "fab fa-python", level: 30 },
        { name: "JavaScript", icon: "fab fa-js", level: 100 },
        { name: "TypeScript", icon: "fas fa-code", level: 72 },
        { name: "Node.js", icon: "fab fa-node-js", level: 84 },
        { name: "React", icon: "fab fa-react", level: 75 },
        { name: "HTML", icon: "fab fa-html5", level: 95 },
        { name: "CSS", icon: "fab fa-css3-alt", level: 79 },
        { name: "EJS", icon: "fas fa-code", level: 85 },
        { name: "Go", icon: "fab fa-golang", level: 25 },
        { name: "PHP", icon: "fab fa-php", level: 86 },
        { name: "SQL", icon: "fas fa-database", level: 69 }
    ];

    const skillsContainer = document.getElementById('skills-container');
    skillsContainer.innerHTML = '';

    skillsContainer.style.gridTemplateColumns = 'repeat(auto-fill, minmax(110px, 1fr))';

    skills.forEach((skill, index) => {
        const skillCard = document.createElement('div');
        skillCard.className = 'skill-card';
        skillCard.setAttribute('data-skill', skill.name);
        
        skillCard.innerHTML = `
            <div class="skill-icon"><i class="${skill.icon}"></i></div>
            <div class="skill-name">${skill.name}</div>
            <div class="skill-level">
                <div class="skill-progress" style="width: 0"></div>
            </div>
        `;
        
        skillsContainer.appendChild(skillCard);
        
        // Progress bar animasyonu
        setTimeout(() => {
            skillCard.querySelector('.skill-progress').style.width = `${skill.level}%`;
        }, 100 * index + 500);
    });
}

document.querySelectorAll('.social-btn').forEach(button => {
    button.addEventListener('click', function(e) {
        e.preventDefault();
        const link = this.getAttribute('data-link');
        window.open(link, '_blank');
    });
});
