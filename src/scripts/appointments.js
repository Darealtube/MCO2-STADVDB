$(document).ready(function () {
  var urlQuery = new URLSearchParams(window.location.search);
  const id = urlQuery.get("id");

  const updateAppointmentData = (appointment) => {
    $(".appointment-id").text(`ID: ${appointment.apptid}`);
    $("#appointment-data").html(`
      <p>ClinicID: ${appointment.clinicid}</p>
      <p>PXID: ${appointment.pxid}</p>
      <p>DoctorID: ${appointment.doctorid}</p>
      <p>Time Queued: ${appointment.TimeQueued}</p>
      <p>Queue Date: ${appointment.QueueDate}</p>
      <p>Start Time: ${appointment.StartTime}</p>
      <p>End Time: ${appointment.EndTime}</p>
      <p>isVirtual: ${appointment.isVirtual}</p>
      <p>Status: ${appointment.status}</p>
      <p>Type: ${appointment.type}</p>
    `);
  };

  const getAppointment = () => {
    $.ajax({
      method: "GET",
      url: `/appointments/${id}`,
      cache: true,
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      success: (data) => {
        updateAppointmentData(data);
      },
      error: ({ responseJSON }) => {
        window.location.href = "/";
      },
    });
  };

  if (!id) {
    window.location.href = "/";
  } else {
    getAppointment();
  }

  $("#edit-appointment").click(function () {
    window.location.href = `/edit.html?id=${id}`;
  });
});
