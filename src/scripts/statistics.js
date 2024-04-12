$(document).ready(() => {
  const getReport1 = () => {
    $.ajax({
      method: "GET",
      url: `/report1`,
      cache: true,
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      success: (data) => {
        const report = data;
        console.log("REPORT1", report);
        report.forEach((rep) => {
          const reportRow = $(
            `<tr><td>${rep.year}</td><td>${rep.month}</td><td>${rep.count}</td></tr>`
          );
          $(".report1-rows").append(reportRow);
        });
      },
      error: ({ responseJSON }) => {
        console.log("THERES AN ERROR AAAA");
      },
    });
  };

  const getReport2 = () => {
    $.ajax({
      method: "GET",
      url: `/report2`,
      cache: true,
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      success: (data) => {
        const report = data;
        console.log("REPORT2", report);
        report.forEach((rep) => {
          const reportRow = $(
            `<tr><td>${rep.clinicid}</td><td>${rep.avg_wait_time_hours}</td></tr>`
          );
          $(".report2-rows").append(reportRow);
        });
      },
      error: ({ responseJSON }) => {
        console.log("THERES AN ERROR AAAA");
      },
    });
  };

  const getReport3 = () => {
    $.ajax({
      method: "GET",
      url: `/report3`,
      cache: true,
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      success: (data) => {
        const report = data;
        console.log("REPORT3", report);
        report.forEach((rep) => {
          const reportRow = $(
            `<tr><td>${rep.specialty}</td><td>${rep.type}</td><td>${rep.avg_wait_time_hours}</td></tr>`
          );
          $(".report3-rows").append(reportRow);
        });
      },
      error: ({ responseJSON }) => {
        console.log("THERES AN ERROR AAAA");
      },
    });
  };

  getReport1();
  getReport2();
  getReport3();
});
