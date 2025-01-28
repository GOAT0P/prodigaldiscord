// DOM Elements
const memberForm = document.getElementById("member-form");
const membersTable = document.getElementById("members-table");
const roleDropdown = document.getElementById("internal_role");
const loadingIndicator = document.getElementById("loading-indicator");

// API Base URL
const API_URL = "http://localhost:3000/api/members";
const DISCORD_API_URL = "http://localhost:3000/api/discord/roles";

// Show loading indicator
function showLoading() {
  loadingIndicator.classList.add("active");
}

// Hide loading indicator
function hideLoading() {
  loadingIndicator.classList.remove("active");
}

// Fetch and display members
async function fetchMembers() {
  if (!membersTable) return; // Exit if not on list page
  
  showLoading();
  try {
    console.log("Fetching members from API:", API_URL); // Debug log for API URL
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch members: ${response.status}`);
    }
    const members = await response.json();
    updateMembersTable(members);
  } catch (error) {
    console.error("Error fetching members:", error);
    alert("Failed to fetch members. Please try again.");
  } finally {
    hideLoading();
  }
}

// Generate a 32-bit reference code
const generateReferenceCode = () => {
  return Math.random().toString(36).substring(2, 10); // Generates a random 8-character string
};

let rolesMap = new Map(); // Store roles data

// Fetch roles and populate the dropdown
async function fetchRoles() {
  try {
    const response = await fetch(DISCORD_API_URL);
    const data = await response.json();
    const roles = data.roles;

    // Update roles map
    rolesMap.clear();
    roles.forEach(role => {
      rolesMap.set(role.id, role.name);
    });

    const roleDropdown = document.getElementById("internal_role");
    // Add guard clause
    if (!roleDropdown) return;

    roleDropdown.innerHTML = "<option value=''>Select Role</option>";
    roles.forEach((role) => {
      const option = document.createElement("option");
      option.value = role.id;
      option.textContent = role.name;
      roleDropdown.appendChild(option);
    });
  } catch (error) {
    console.error("Error fetching roles:", error);
  }
}

// Create role dropdown for editing
function createRoleDropdown(currentRoleId) {
  const select = document.createElement('select');
  select.className = 'editable editing';
  rolesMap.forEach((name, id) => {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = name;
    option.selected = id === currentRoleId;
    select.appendChild(option);
  });
  return select;
}

// Call fetchRoles on page load
fetchRoles();

// Add a new member
async function addMember(event) {
  event.preventDefault();
  showLoading();
  console.log("Add Member form submitted"); // Debug log for form submission

  const memberData = {
    batch_code: document.getElementById("batch_code").value,
    first_name: document.getElementById("first_name").value,
    last_name: document.getElementById("last_name").value,
    internal_role: document.getElementById("internal_role").value,
    reference_code: generateReferenceCode(), // Generate Reference Code
  };

  console.log("Member Data:", memberData); // Debug log for member data
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(memberData),
    });

    console.log("Add Member Response:", response); // Debug log for response
    if (response.ok) {
      fetchMembers(); // Refresh the table
      memberForm.reset(); // Clear the form
    } else {
      const errorText = await response.text();
      console.error("Failed to add member:", errorText); // Log the response text
    }
  } catch (error) {
    console.error("Error adding member:", error);
    alert("Failed to add member. Please try again.");
  } finally {
    hideLoading();
  }
}

// Delete a member
async function deleteMember(id) {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });

    console.log("Delete Member Response:", response); // Debug log for response
    if (response.ok) {
      fetchMembers(); // Refresh the table
    } else {
      console.error("Failed to delete member:", await response.text());
    }
  } catch (error) {
    console.error("Error deleting member:", error);
  }
}

// Fetch recent members for home page
async function fetchRecentMembers() {
  try {
    const response = await fetch(`${API_URL}/recent`);
    if (!response.ok) throw new Error('Failed to fetch recent members');
    
    const members = await response.json();
    const recentTable = document.getElementById("recent-members-table");
    
    if (!recentTable) return;
    
    recentTable.innerHTML = members
        .slice(0, 5)
        .map(member => `
            <tr>
                <td>${member.batch_code}</td>
                <td>${member.first_name} ${member.last_name}</td>
                <td>${rolesMap.get(member.internal_role) || 'Unknown'}</td>
                <td>${new Date(member.created_at).toLocaleDateString()}</td>
            </tr>
        `).join('');
  } catch (error) {
    console.error("Error fetching recent members:", error);
  }
}

// Filter members
async function applyFilters() {
  const batchFilter = document.getElementById("batch-filter");
  if (!batchFilter) return;
  
  const selectedBatch = batchFilter.value;
  showLoading();
  
  try {
    const url = selectedBatch ? 
      `${API_URL}?batch=${encodeURIComponent(selectedBatch)}` : 
      API_URL;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch filtered members');
    
    const members = await response.json();
    updateMembersTable(members);
  } catch (error) {
    console.error("Error filtering members:", error);
    alert("Failed to filter members");
  } finally {
    hideLoading();
  }
}

// Clear filters
function clearFilters() {
  const batchFilter = document.getElementById("batch-filter");
  if (batchFilter) {
    batchFilter.value = '';
    fetchMembers(); // Show all members
  }
}

// Edit member
function editMember(id, row) {
  if (!id || !row) return;
  
  const cells = row.cells;
  const data = {
      batch_code: cells[0].textContent,
      first_name: cells[1].textContent,
      last_name: cells[2].textContent,
      internal_role: cells[3].getAttribute('data-role-id')
  };

  console.log('Editing member:', { id, data }); // Debug log
  openModal(id, data);
}

// Publish changes
async function publishChanges(id, row) {
  if (!loadingIndicator) return; // Early return if loading indicator not found
  
  const cells = row.cells;
  const updatedData = {
    batch_code: cells[0].querySelector('input').value,
    first_name: cells[1].querySelector('input').value,
    last_name: cells[2].querySelector('input').value,
    internal_role: cells[3].querySelector('select').value,
  };

  try {
    showLoading();
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData)
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    await updateDiscordRole(id, updatedData.internal_role);
    await fetchMembers();
  } catch (error) {
    console.error('Error updating member:', error);
    alert('Failed to update member. Please try again.');
  } finally {
    hideLoading();
  }
}

// Cancel edit mode
function cancelEdit(id) {
  if (!id) return;
  const row = document.querySelector(`tr[data-member-id="${id}"]`);
  if (row) {
    const cells = row.cells;
    // Restore original content
    cells[0].textContent = cells[0].getAttribute('data-original');
    cells[1].textContent = cells[1].getAttribute('data-original');
    cells[2].textContent = cells[2].getAttribute('data-original');
    cells[3].textContent = rolesMap.get(cells[3].getAttribute('data-role-id')) || 'Unknown';
    
    // Restore action buttons
    cells[cells.length - 1].innerHTML = `
      <div class="action-buttons">
        <button class="btn btn-warning" onclick="editMember('${id}', this.closest('tr'))">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Edit
        </button>
        <button class="btn btn-danger" onclick="deleteMember('${id}')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
          Delete
        </button>
      </div>
    `;
  }
}

// Update Discord role
async function updateDiscordRole(memberId, newRoleId) {
  try {
    await fetch(`${API_URL}/${memberId}/discord-role`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roleId: newRoleId })
    });
  } catch (error) {
    console.error('Error updating Discord role:', error);
  }
}

// Update the table row template in fetchMembers()
function updateMembersTable(members) {
  if (!membersTable) return;
  
  membersTable.innerHTML = members.map(member => `
    <tr data-member-id="${member.id}">
      <td class="editable" data-original="${member.batch_code}">${member.batch_code}</td>
      <td class="editable" data-original="${member.first_name}">${member.first_name}</td>
      <td class="editable" data-original="${member.last_name}">${member.last_name}</td>
      <td class="editable" data-role-id="${member.internal_role}" data-original="${rolesMap.get(member.internal_role) || 'Unknown'}">${rolesMap.get(member.internal_role) || 'Unknown'}</td>
      <td>${member.discord_id || 'Not linked'}</td>
      <td>${member.reference_code}</td>
      <td>
        <div class="action-buttons">
          <button class="btn btn-warning" onclick="editMember('${member.id}', this.closest('tr'))">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Edit
          </button>
          <button class="btn btn-danger" onclick="deleteMember('${member.id}')">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
            Delete
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// Get unique batch codes
async function fetchBatchCodes() {
  try {
    const response = await fetch(API_URL);
    const members = await response.json();
    const uniqueBatches = [...new Set(members.map(member => member.batch_code))];
    
    const batchFilter = document.getElementById("batch-filter");
    if (batchFilter) {
      batchFilter.innerHTML = `
        <option value="">All Batches</option>
        ${uniqueBatches.map(batch => `<option value="${batch}">${batch}</option>`).join('')}
      `;
    }
  } catch (error) {
    console.error("Error fetching batch codes:", error);
  }
}

// Initialize page based on current page
async function initializePage() {
    const path = window.location.pathname;
    const isHomePage = path.endsWith('index.html') || path.endsWith('/');
    const isListPage = path.includes('list.html');

    try {
        await fetchRoles();
        
        if (isListPage) {
            showLoading();
            await Promise.all([fetchBatchCodes(), fetchMembers()]);
        }
        
        if (isHomePage) {
            showLoading();
            const response = await fetch(`${API_URL}/recent`);
            const members = await response.json();
            const recentTable = document.getElementById("recent-members-table");
            
            if (recentTable && members.length > 0) {
                recentTable.innerHTML = members.slice(0, 5).map(member => `
                    <tr>
                        <td>${member.batch_code}</td>
                        <td>${member.first_name} ${member.last_name}</td>
                        <td>${rolesMap.get(member.internal_role) || 'Unknown'}</td>
                        <td>${new Date(member.created_at).toLocaleDateString()}</td>
                    </tr>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error during initialization:', error);
    } finally {
        hideLoading();
    }
}

// Initialize based on current page
if (window.location.pathname.includes('index.html')) {
  fetchRecentMembers();
}

// Event Listeners
if (memberForm) {
  console.log("Setting up event listener for member form"); // Debug log for event listener setup
  memberForm.addEventListener("submit", addMember);
}

// Initial fetch
initializePage();

document.addEventListener('DOMContentLoaded', initializePage);

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
  const isListPage = window.location.pathname.includes('list.html');
  const isHomePage = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');

  await fetchRoles();
  
  if (isListPage) {
    await fetchBatchCodes();
    await fetchMembers();
  }
  
  if (isHomePage) {
    await fetchRecentMembers();
  }
  
  if (memberForm) {
    memberForm.addEventListener("submit", addMember);
  }
});

// Modal functionality
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');

async function openModal(id, data) {
    if (!editModal || !editForm) return;
    
    try {
        // Ensure roles are loaded
        if (rolesMap.size === 0) {
            await fetchRoles();
        }
        
        // Populate form fields
        document.getElementById('edit-id').value = id;
        document.getElementById('edit-batch-code').value = data.batch_code;
        document.getElementById('edit-first-name').value = data.first_name;
        document.getElementById('edit-last-name').value = data.last_name;
        
        // Populate role dropdown
        const roleSelect = document.getElementById('edit-role');
        roleSelect.innerHTML = Array.from(rolesMap.entries())
            .map(([roleId, roleName]) => `
                <option value="${roleId}" ${roleId === data.internal_role ? 'selected' : ''}>
                    ${roleName}
                </option>
            `).join('');
        
        console.log('Populated roles:', rolesMap);
        console.log('Selected role:', data.internal_role);
        
        // Show modal
        editModal.classList.add('active');
        
    } catch (error) {
        console.error('Error opening modal:', error);
        alert('Failed to load role data. Please try again.');
    }
}

editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        if (rolesMap.size === 0) {
            throw new Error('Roles not loaded. Please try again.');
        }

        const id = document.getElementById('edit-id').value;
    
        const updatedData = {
            batch_code: document.getElementById('edit-batch-code').value,
            first_name: document.getElementById('edit-first-name').value,
            last_name: document.getElementById('edit-last-name').value,
            internal_role: document.getElementById('edit-role').value
        };

        try {
            showLoading();
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            });

            if (!response.ok) throw new Error(await response.text());
            
            await updateDiscordRole(id, updatedData.internal_role);
            await fetchMembers();
            closeModal();
        } catch (error) {
            console.error('Error updating member:', error);
            alert('Failed to update member: ' + error.message);
        } finally {
            hideLoading();
        }
    } catch (error) {
        console.error('Error in form submission:', error);
        alert(error.message);
    }
});

function closeModal() {
    editModal.classList.remove('active');
    editForm.reset();
}

// Update tables to use proper roles
function updateMembersTable(members) {
    if (!membersTable) return;
    
    membersTable.innerHTML = members.map(member => `
        <tr data-member-id="${member.id}">
            <td>${member.batch_code}</td>
            <td>${member.first_name}</td>
            <td>${member.last_name}</td>
            <td data-role-id="${member.internal_role}">${rolesMap.get(member.internal_role) || 'Unknown'}</td>
            <td>${member.discord_id || 'Not linked'}</td>
            <td>${member.reference_code}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-warning" onclick="editMember('${member.id}', this.closest('tr'))">Edit</button>
                    <button class="btn btn-danger" onclick="deleteMember('${member.id}')">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}
