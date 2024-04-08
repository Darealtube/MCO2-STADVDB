$(document).ready(function(){
    $('.appointment-list').click(function(e)
    {
        window.location.href = "appointment.html";
    });
    
    $('#edit-appointment').click(function(e)
    {
        window.location.href = "edit.html";
    });

    $('#back-appointment-data').click(function(e)
    {
        window.location.href = "index.html";
    });
    
    $('#cancel').click(function(e)
    {
        window.location.href = "appointment.html";
    });

    $('#create-appointment').click(function(e)
    {
        window.location.href = "create.html";
    });
});