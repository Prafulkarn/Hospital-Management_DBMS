async function loadDoctors() {
  const doctors = await apiFetch('/doctors');

  document.getElementById('page-doctors').innerHTML = `
    <h1>Doctors</h1>
    <p class="sub">Medical staff directory</p>
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>ID</th><th>Name</th><th>Specialization</th><th>Department</th><th>Phone</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody>
          ${doctors.map(d => `
            <tr>
              <td>#${d.doctor_id}</td>
              <td>${d.name}</td>
              <td>${d.specialization}</td>
              <td>${d.department_name || '—'}</td>
              <td>${d.phone || '—'}</td>
              <td>${d.available
                ? '<span class="badge badge-green">Available</span>'
                : '<span class="badge badge-red">Unavailable</span>'}</td>
              <td>
                <button class="btn btn-sm btn-primary" onclick="viewDoctorSchedule(${d.doctor_id}, '${d.name}')">Schedule</button>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
}

async function viewDoctorSchedule(id, name) {
  const schedule = await apiFetch(`/doctors/${id}/schedule`);

  openModal(`
    <h2>Dr. ${name} — Schedule</h2>
    <div class="table-wrap" style="margin-top:16px">
      <table>
        <thead><tr><th>Date</th><th>Time</th><th>Patient</th><th>Status</th></tr></thead>
        <tbody>
          ${schedule.length
            ? schedule.map(s => `
              <tr>
                <td>${s.appt_date}</td>
                <td>${s.appt_time}</td>
                <td>${s.patient_name}</td>
                <td>${badgeStatus(s.status)}</td>
              </tr>`).join('')
            : '<tr><td colspan="4" class="empty">No appointments scheduled</td></tr>'
          }
        </tbody>
      </table>
    </div>
  `);
}