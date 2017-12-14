$(document).ready(function() {
    $('#list').click(function(event){event.preventDefault();$('#yelpcamps .item').addClass('list-group-item');});
    $('#grid').click(function(event){event.preventDefault();$('#yelpcamps .item').removeClass('list-group-item');$('#yelpcamps .item').addClass('grid-group-item');});
});