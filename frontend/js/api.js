const API = 'http://localhost:3000/api';

async function apiFetch(path, options = {}) {
  try {
    const res = await fetch(API + path, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  } catch (err) {
    alert('Error: ' + err.message);
    throw err;
  }
}

function openModal(html) {
  document.getElementById('modal-content').innerHTML = html;
  document.getElementById('modal-overlay').classList.remove('hidden');
}
function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}
document.getElementById('modal-close').addEventListener('click', closeModal);

function badgeStatus(status) {
  const map = { Scheduled: 'badge-blue', Completed: 'badge-green', Cancelled: 'badge-red' };
  return `<span class="badge ${map[status] || 'badge-blue'}">${status}</span>`;
}
function badgePaid(paid) {
  return paid
    ? `<span class="badge badge-green">Paid</span>`
    : `<span class="badge badge-warn">Unpaid</span>`;
}