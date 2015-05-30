//CanvasJS
function makeChart() {
    var chart = new CanvasJS.Chart("chartContainer",
	{
		title:{
			text: "Email Categories",
			verticalAlign: 'top',
			horizontalAlign: 'left'
		},
                animationEnabled: true,
		data: [
		{        
			type: "doughnut",
			startAngle:20,
			toolTipContent: "{label}: {y} - <strong>#percent%</strong>",
			indexLabel: "{label} #percent%",
			dataPoints: [
				{  y: 67, label: "Inbox" },
				{  y: 28, label: "Archives" },
				{  y: 10, label: "Labels" },
				{  y: 7,  label: "Drafts"},
				{  y: 4,  label: "Trash"}
			]
		}
		]
	});
	chart.render();
}

//Only render the chart when modal gets clicked
$(document).ready(function() {
    var clickLink = document.getElementById("modal-link");
    clickLink.addEventListener('click', makeChart);
});