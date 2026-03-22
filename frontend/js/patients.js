async function loadPatients() {
  const patients = await apiFetch('/patients');

  document.getElementById('page-patients').innerHTML = `
    <h1>Patients</h1>
    <p class="sub">Manage patient registrations</p>
    <div class="toolbar">
      <span>${patients.length} patients registered</span>
      <button class="btn btn-primary" onclick="showAddPatient()">+ Add Patient</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>ID</th><th>Name</th><th>Gender</th><th>Blood Group</th><th>Phone</th><th>Registered</th><th>Actions</th></tr>
        </thead>
        <tbody>
          ${patients.map(p => `
            <tr>
              <td>#${p.patient_id}</td>
              <td>${p.name}</td>
              <td>${p.gender || '—'}</td>
              <td>${p.blood_group || '—'}</td>
              <td>${p.phone || '—'}</td>
              <td>${new Date(p.created_at).toLocaleDateString()}</td>
              <td>
                <button class="btn btn-sm btn-primary" onclick="viewPatientHistory(${p.patient_id}, '${p.name}')">History</button>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function showAddPatient() {
  openModal(`
    <h2>Register New Patient</h2>
    <div class="form-grid">
      <div class="form-group"><label>Full Name</label><input id="p-name" placeholder="Ram Bahadur" /></div>
      <div class="form-group"><label>Date of Birth</label><input id="p-dob" type="date" /></div>
      <div class="form-group">
        <label>Gender</label>
        <select id="p-gender"><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select>
      </div>
      <div class="form-group"><label>Blood Group</label><input id="p-blood" placeholder="O+" /></div>
      <div class="form-group"><label>Phone</label><input id="p-phone" placeholder="98XXXXXXXX" /></div>
      <div class="form-group"><label>Email</label><input id="p-email" type="email" placeholder="patient@email.com" /></div>
      <div class="form-group full"><label>Address</label><textarea id="p-address" placeholder="Kathmandu, Nepal"></textarea></div>
      <div class="form-actions">
        <button class="btn" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="submitAddPatient()">Register Patient</button>
      </div>
    </div>
  `);
}

async function submitAddPatient() {
  const body = {
    name:        document.getElementById('p-name').value,
    dob:         document.getElementById('p-dob').value,
    gender:      document.getElementById('p-gender').value,
    blood_group: document.getElementById('p-blood').value,
    phone:       document.getElementById('p-phone').value,
    email:       document.getElementById('p-email').value,
    address:     document.getElementById('p-address').value,
  };
  if (!body.name || !body.phone) return alert('Name and phone are required.');
  await apiFetch('/patients', { method: 'POST', body: JSON.stringify(body) });
  closeModal();
  loadPatients();
}

async function viewPatientHistory(id, name) {
  const history = await apiFetch(`/patients/${id}/history`);
  const summary = await apiFetch(`/patients/${id}/summary`);

  openModal(`
    <h2>${name} — History</h2>
    <div class="stats" style="margin-bottom:20px">
      <div class="stat-card blue"><div class="label">Appointments</div><div class="value">${summary.total_appointments}</div></div>
      <div class="stat-card green"><div class="label">Records</div><div class="value">${summary.total_records}</div></div>
      <div class="stat-card warn"><div class="label">Total Billed</div><div class="value">Rs.${summary.total_billed}</div></div>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Date</th><th>Doctor</th><th>Diagnosis</th><th>Amount</th><th>Paid</th></tr></thead>
        <tbody>
          ${history.length
            ? history.map(r => `
              <tr>
                <td>${r.appt_date}</td>
                <td>${r.doctor_name}</td>
                <td>${r.diagnosis || '—'}</td>
                <td>${r.amount ? 'Rs.' + r.amount : '—'}</td>
                <td>${r.amount !== null ? badgePaid(r.paid) : '—'}</td>
              </tr>`).join('')
            : '<tr><td colspan="5" class="empty">No history found</td></tr>'
          }
        </tbody>
      </table>
    </div>
  `);
}