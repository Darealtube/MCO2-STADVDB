$(document).ready(function () {
  var urlQuery = new URLSearchParams(window.location.search);
  const id = urlQuery.get("id");
  let apptRegion;

  const formatDate = (datetimeInput) => {
    // Convert the input value to a JavaScript Date object
    var date = new Date(datetimeInput);

    // Format the date to Y-m-d H:i:s format
    var formattedDate =
      date.getFullYear() +
      "-" +
      ("0" + (date.getMonth() + 1)).slice(-2) +
      "-" +
      ("0" + date.getDate()).slice(-2) +
      " " +
      ("0" + date.getHours()).slice(-2) +
      ":" +
      ("0" + date.getMinutes()).slice(-2) +
      ":" +
      ("0" + date.getSeconds()).slice(-2);

    return formattedDate;
  };

  const updateAppointmentData = (appointment) => {
    $(".appointment-id").text(`ID: ${appointment.apptid}`);

    var formattedTimeQueued = formatDate(appointment.TimeQueued);
    $("#timeQueued").val(formattedTimeQueued);
    var formattedQueueDate = formatDate(appointment.QueueDate);
    $("#queueDate").val(formattedQueueDate);
    var formattedStartTime = formatDate(appointment.StartTime);
    $("#startTime").val(formattedStartTime);
    var formattedEndTime = formatDate(appointment.EndTime);
    $("#endTime").val(formattedEndTime);

    if (appointment.isVirtual) {
      $("#Yes").prop("checked", true);
    } else {
      $("#No").prop("checked", true);
    }

    $(`#${appointment.status}`).prop("checked", true);
    $(`#${appointment.type}`).prop("checked", true);

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
        updateAppointmentData(data[0]);
        apptRegion = data[0].region;
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

  $("#cancel").click(function () {
    window.location.href = `/appointment.html?id=${id}`;
  });

  $("#edit").click(function () {
    const isVirtual =
      $("input[name='isVirtual']:checked").val() == "Yes" ? true : false;
    const status = $("input[name='status']:checked").val();
    const type = $("input[name='type']:checked").val();

    $.ajax({
      method: "PUT",
      url: `/appointments/${id}/${apptRegion}`,
      data: JSON.stringify({
        TimeQueued: formatDate($("#timeQueued").val()),
        QueueDate: formatDate($("#queueDate").val()),
        StartTime: formatDate($("#startTime").val()),
        EndTime: formatDate($("#endTime").val()),
        isVirtual,
        status,
        type,
      }),
      contentType: "application/json",
      success: () => {
        window.location.href = `/appointment.html?id=${id}`;
      },
      error: () => {
        window.location.href = `/appointment.html?id=${id}`;
      },
    });
  });
});
