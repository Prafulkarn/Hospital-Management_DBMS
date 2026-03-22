async function loadAppointments() {
  const appointments = await apiFetch('/appointments');

  document.getElementById('page-appointments').innerHTML = `
    <h1>Appointments</h1>
    <p class="sub">Schedule and manage appointments</p>
    <div class="toolbar">
      <span>${appointments.length} total appointments</span>
      <button class="btn btn-primary" onclick="showBookAppointment()">+ Book Appointment</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>ID</th><th>Patient</th><th>Doctor</th><th>Date</th><th>Time</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody>
          ${appointments.map(a => `
            <tr>
              <td>#${a.appt_id}</td>
              <td>${a.patient_name}</td>
              <td>${a.doctor_name}</td>
              <td>${a.appt_date}</td>
              <td>${a.appt_time}</td>
              <td>${badgeStatus(a.status)}</td>
              <td style="display:flex;gap:6px;flex-wrap:wrap">
                ${a.status === 'Scheduled' ? `
                  <button class="btn btn-sm btn-success" onclick="completeAppt(${a.appt_id})">Complete</button>
                  <button class="btn btn-sm btn-danger"  onclick="cancelAppt(${a.appt_id})">Cancel</button>
                ` : '—'}
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
}

async function showBookAppointment() {
  const [patients, doctors] = await Promise.all([
    apiFetch('/patients'),
    apiFetch('/doctors'),
  ]);

  openModal(`
    <h2>Book Appointment</h2>
    <div class="form-grid">
      <div class="form-group">
        <label>Patient</label>
        <select id="a-patient">
          <option value="">Select patient</option>
          ${patients.map(p => `<option value="${p.patient_id}">${p.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Doctor</label>
        <select id="a-doctor">
          <option value="">Select doctor</option>
          ${doctors.map(d => `<option value="${d.doctor_id}">${d.name} (${d.specialization})</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Date</label><input id="a-date" type="date" /></div>
      <div class="form-group"><label>Time</label><input id="a-time" type="time" /></div>
      <div class="form-group full"><label>Notes</label><textarea id="a-notes" placeholder="Optional notes..."></textarea></div>
      <div class="form-actions">
        <button class="btn" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="submitBookAppointment()">Book</button>
      </div>
    </div>
  `);
}

async function submitBookAppointment() {
  const body = {
    patient_id: document.getElementById('a-patient').value,
    doctor_id:  document.getElementById('a-doctor').value,
    appt_date:  document.getElementById('a-date').value,
    appt_time:  document.getElementById('a-time').value,
    notes:      document.getElementById('a-notes').value,
  };
  if (!body.patient_id || !body.doctor_id || !body.appt_date || !body.appt_time)
    return alert('All fields except notes are required.');
  await apiFetch('/appointments', { method: 'POST', body: JSON.stringify(body) });
  closeModal();
  loadAppointments();
}

async function completeAppt(id) {
  if (!confirm('Mark this appointment as completed?')) return;
  await apiFetch(`/appointments/${id}/complete`, { method: 'PUT' });
  loadAppointments();
}

async function cancelAppt(id) {
  if (!confirm('Cancel this appointment?')) return;
  await apiFetch(`/appointments/${id}/cancel`, { method: 'PUT' });
  loadAppointments();
}