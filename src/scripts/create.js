$(document).ready(function () {
  const generateClinics = () => {
    $.ajax({
      method: "GET",
      url: `/clinics`,
      cache: true,
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      success: (data) => {
        for (let i = 0; i < data.length; ++i) {
          const clinic = $(
            `<option value="${data[i].clinicid}">${data[i].clinicid}</option>`
          );
          $("#clinicid").append(clinic);
        }
      },
      error: ({ responseJSON }) => {
        console.log("THERES AN ERROR AAAA");
      },
    });
  };

  const generateDoctors = () => {
    $.ajax({
      method: "GET",
      url: `/doctors`,
      cache: true,
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      success: (data) => {
        for (let i = 0; i < data.length; ++i) {
          const doctor = $(
            `<option value="${data[i].doctorid}">${data[i].doctorid}</option>`
          );
          $("#doctorid").append(doctor);
        }
      },
      error: ({ responseJSON }) => {
        console.log("THERES AN ERROR AAAA");
      },
    });
  };

  const generatePX = () => {
    $.ajax({
      method: "GET",
      url: `/px`,
      cache: true,
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      success: (data) => {
        for (let i = 0; i < data.length; ++i) {
          const px = $(
            `<option value="${data[i].pxid}">${data[i].pxid}</option>`
          );
          $("#pxid").append(px);
        }
      },
      error: ({ responseJSON }) => {
        console.log("THERES AN ERROR AAAA");
      },
    });
  };

  generateClinics();
  generateDoctors();
  generatePX();

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

  $("#create").click(function () {
    $(".create-error").text("");
    let apptid = uuidv4();
    apptid = apptid.split("-").join("").toUpperCase();
    const clinicid = $("#clinicid").val();
    const doctorid = $("#doctorid").val();
    const pxid = $("#pxid").val();
    const isVirtual =
      $("input[name='isVirtual']:checked").val() == "Yes" ? true : false;
    const status = $("input[name='status']:checked").val();
    const type = $("input[name='type']:checked").val();

    $.ajax({
      method: "POST",
      url: `/appointments`,
      data: JSON.stringify({
        apptid,
        pxid,
        doctorid,
        clinicid,
        status,
        TimeQueued: formatDate($("#timeQueued").val()),
        QueueDate: formatDate($("#queueDate").val()),
        StartTime: formatDate($("#startTime").val()),
        EndTime: formatDate($("#endTime").val()),
        type,
        isVirtual,
      }),
      contentType: "application/json",
      success: (data) => {
        console.log("YEHEY");
        window.location.href = `/`;
      },
      error: (data) => {
        $(".create-error").text("You have an error in your input.");
        console.log("ERROR AAAAAAA");
      },
    });
  });
});
