function makeChart() {  
    $.ajax({
        url:"https://www.kimonolabs.com/api/ba3gx8yk?apikey="+apikey.kimonolabs,
        crossDomain: true,
        dataType: "jsonp",
        success: function (response) {
            //If calling the API was successful create a canvasjs chart
            var collection = response.results.biersorten;
            var finals = [];
            for(var i = 0; i < collection.length; i++)
            {
                finals.push({ 'y': parseInt(collection[i].anzahl), 'label': collection[i].sorte.text });
            }
                    
            var chart = new CanvasJS.Chart("chartContainer",{
                animationEnabled: true,
                title:{
                    text: "Biersorten"
                },
                
                data: [
                {
                    type: "pie",
                    dataPoints: finals
                }
                ]
            });
            chart.render();
        },
        error: function (xhr, status) {
            //handle errors
        }
    });
}

//Only render the chart when modal gets clicked
$(document).ready(function() {
    var clickLink = document.getElementById("modal-link");
    clickLink.addEventListener('click', makeChart);
});