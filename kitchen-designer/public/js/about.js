const API_BASE = location.hostname === "localhost"
    ? "http://localhost:3001"
    : "https://api.gudinocustom.com";
// Icons as SVG strings
const icons = {
    user: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
    mail: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="m22 7-10 5L2 7"></path></svg>',
    phone: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>',
    calendar: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>'
};

async function loadTeamMembers() {
    const teamGrid = document.getElementById('teamGrid');

    try {
        const response = await fetch(`${API_BASE}/api/employees`);

        if (!response.ok) {
            throw new Error('Failed to load team members');
        }

        const employees = await response.json();

        if (employees.length === 0) {
            teamGrid.innerHTML = '<p class="loading" style="color:white; font-size: 1.2rem; font-weight:bold;">No team members found.</p>';
            return;
        }

        teamGrid.innerHTML = employees.map((employee, index) => `
                    <div class="team-member" style="animation-delay: ${index * 0.1}s">
                        ${employee.photo_url
                ? `<img src="${API_BASE}${employee.photo_url}" alt="${employee.name}" class="member-photo">`
                : `<div class="member-photo placeholder">${icons.user}</div>`
            }
                        <div class="member-info">
                            <h3 class="member-name">${employee.name}</h3>
                            <p class="member-position">${employee.position}</p>
                            ${employee.bio ? `<p class="member-bio">${employee.bio}</p>` : ''}
                            <div class="member-contact">
                                ${employee.email ? `
                                    <div class="contact-item">
                                        ${icons.mail}
                                        <span>${employee.email}</span>
                                    </div>
                                ` : ''}
                                ${employee.phone ? `
                                    <div class="contact-item">
                                        ${icons.phone}
                                        <span>${employee.phone}</span>
                                    </div>
                                ` : ''}
                            </div>
                            ${employee.joined_date ? `
                                <div class="joined-date">
                                    ${icons.calendar}
                                    <span>Joined ${new Date(employee.joined_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `).join('');

    } catch (error) {
        console.error('Error loading team members:', error);
        teamGrid.innerHTML = '<div class="error-message">Unable to load team members. Please try again later.</div>';
    }
}

// Load team members when page loads
document.addEventListener('DOMContentLoaded', loadTeamMembers);