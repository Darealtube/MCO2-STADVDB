$(document).ready(() => {
  // Generates a string HTML that will be converted to an actual element later on
  const generateAppointment = (appointmentData) => {
    return `
    <div class="container" id="${appointmentData.apptid}">
      <h4>ID: ${appointmentData.apptid} </h4>
      <p>ClinicID: ${appointmentData.clinicid} </p>
      <p>PXID: ${appointmentData.pxid} </p>
      <p>DoctorID: ${appointmentData.doctorid} </p>
      <p>Time Queued: ${appointmentData.TimeQueued} </p>
      <p>Queue Date: ${appointmentData.QueueDate} </p>
      <p>Start Time: ${appointmentData.StartTime} </p>
      <p>End Time: ${appointmentData.EndTime} </p>
      <p>isVirtual: ${appointmentData.isVirtual} </p>
      <p>Status: ${appointmentData.status} </p>
      <p>Type: ${appointmentData.type} </p>
    </div>
    <hr>
      `;
  };

  // Appends generated HTML of each post to the post container that contains the posts
  const appendAppointments = (appointments) => {
    for (let i = 0; i < appointments.length; ++i) {
      const appointment = $(generateAppointment(appointments[i]));
      $(".appointment-list").append(appointment);
    }
  };

  // Performs an AJAX request in which fetches the API route for posts to return post data
  const getAppointments = () => {
    $.ajax({
      method: "GET",
      url: `/appointments`,
      cache: true,
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      success: (data) => {
        appendAppointments(data[0]);
      },
      error: ({ responseJSON }) => {
        console.log("THERES AN ERROR AAAA");
      },
    });
  };

  $(".search-btn").click(function () {
    $(".search-error").text("");
    const id = $("#search-appointment").val();

    if (id == "") $(".search-error").text("Appointment does not exist.");

    $.ajax({
      method: "GET",
      url: `/appointments/${id}`,
      cache: true,
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      success: (data) => {
        window.location.href = `/appointment.html?id=${data.apptid}`;
      },
      error: ({ responseJSON }) => {
        $(".search-error").text("Appointment does not exist.");
      },
    });
  });

  // Get the initial post data on page load.
  getAppointments();

  $(".appointment-list").on("click", ".container", function () {
    const id = $(this).attr("id");
    console.log(id);
    window.location.href = `/appointment.html?id=${id}`;
  });
});
