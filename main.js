// i suck at variable naming
// don't worry we all do
// yea btw why so much commented code lol deleted everything

clickTimes = [];
deviations = [];
timeDiffs = [];
testRunning = false; // the lack of camelcase is screwing with me, TODO
// dont worry bro i gotch u

var xVal = 0;
var yVal = 0;
var updateInterval = 100;
var dataLength = 50;
var runNumber = 0;
var counterNumber = 0;

var baseData = {
    type: "spline",
    dataPoints: []
};

function beginTest() {
    testRunning = true;
    clickLimit = Math.round(parseInt(document.getElementById('clickNum').value));
    timeLimit = Math.round(parseInt(document.getElementById('clickTime').value));
    if (timeLimit < 2) {
        alert("Please enter a value larger than 2");
        testRunning = false;
        return false;
    }
    if (clickLimit < 3) {
        alert("Please enter a value larger than 3");
        testRunning = false;
        return false;
    }
    clickTimes.length = 0;
    deviations.length = 0;
    timeDiffs.length = 0;
    beginTime = -1;
    key1 = String($('#key1').val()).toLowerCase();
    key2 = String($('#key2').val()).toLowerCase();
    mouse = $("input[name='cmouse']").prop("checked");
    $("div#status").html("Test ready, press " + key1 + " or " + key2 + " to begin.");
    $("div#result").html("\
        Tap Speed: 0 taps / 0 seconds<br>\
        Stream Speed: 0 bpm<br>\
        Unstable Rate: 0\
    ");
    localStorage.setItem('clickLimit', clickLimit);
    localStorage.setItem('timeLimit', timeLimit);
    localStorage.setItem('key1', key1);
    localStorage.setItem('key2', key2);
    localStorage.setItem('mouse', mouse);
    std = 0;
    $("button#submit").hide();
    $("button#stopbtn").show();
    if (runNumber > 0) {
        $("#chartContainer").CanvasJSChart().options.data.push({
            type: "spline",
            dataPoints: []
        });
        $("#chartContainer").CanvasJSChart().options.data[runNumber - 1].visible = false;
    }
    $("#chartContainer").CanvasJSChart().render();
    counterNumber = 0;
    return true;
}

function radiof(num) {
    if (num == 1) {
        $("#numClicks").show();
        $("#timeClicks").hide();
    }
    if (num == 2) { // Not using else because maybe implement a both option
        $("#timeClicks").show();
        $("#numClicks").hide();
    }
}

function endTest() {
    if (clickTimes.length == 0)
    {
        return;
    }

    testRunning = false;
    update(false);
    beginTime = -1;
    $("button#submit").html("Retry");
    $("div#status").html("Test Finished. Hit the Retry button or press Enter to try again.");
    if ($("input[name='roption']:checked").val() == "time")
        window.clearInterval(endTimer);
    window.clearInterval(updater);
    $("button#submit").show();
    $("button#stopbtn").hide();
    runNumber = runNumber + 1;
    return;
}

function update(click) {
    if (click) {
        if (timeDiffs.length > 0) {
            sum = timeDiffs.reduce(function(a, b) {
                return a + b
            });
            avg = sum / timeDiffs.length;
            $.each(timeDiffs, function(i, v) {
                deviations[i] = (v - avg) * (v - avg);
            });
            variance = deviations.reduce(function(a, b) {
                return a + b;
            });
            std = Math.sqrt(variance / deviations.length);
            unstableRate = std * 10;
        }
        clickTimes.push(Date.now());
        if (clickTimes.length > 1)
            timeDiffs.push(clickTimes[clickTimes.length - 1] - clickTimes[clickTimes.length - 2]);

        if (clickTimes.length > 2) {
            var chart = $("#chartContainer").CanvasJSChart();
            chart.options.data[runNumber].dataPoints.push({
                x: (Date.now() - beginTime) / 1000.0,
                y: (Math.round((((clickTimes.length) / (Date.now() - beginTime) * 60000) / 4) * 100) / 100)
            });
            chart.render();
        }
    } else {
        counterNumber = (counterNumber + 1) % 30;
        streamtime = (Date.now() - beginTime) / 1000;
        if (timeDiffs.length < 2) {
            $("div#result").html("\
		Tap Speed: " + (clickTimes.length.toString() + " taps / " + streamtime.toFixed(1)) + " seconds<br>\
		Stream Speed: " + (Math.round((((clickTimes.length) / (Date.now() - beginTime) * 60000) / 4) * 100) / 100).toFixed(1) + " bpm<br>\
		Unstable Rate: n/a\
	");
        } else {
            $("div#result").html("\
		    Tap Speed: " + (clickTimes.length.toString() + " taps / " + streamtime.toFixed(1)) + " seconds<br>\
		    Stream Speed: " + (Math.round((((clickTimes.length) / (Date.now() - beginTime) * 60000) / 4) * 100) / 100).toFixed(1) + " bpm<br>\
		    Unstable Rate: " + (Math.round(unstableRate * 100000) / 100000).toFixed(1) + "\
	    ");
            if (counterNumber == 0) {
                var chart = $("#chartContainer").CanvasJSChart();
                chart.options.data[runNumber].dataPoints.push({
                    x: (Date.now() - beginTime) / 1000.0,
                    y: (Math.round((((clickTimes.length) / (Date.now() - beginTime) * 60000) / 4) * 100) / 100)
                });
                chart.render();
            }
        }
    }
}

$(document).keypress(function(event) {
    if (event.keyCode == 13 && testRunning == false)
        beginTest();
    if (testRunning == true)
    {
		const char = String.fromCharCode(event.which).toLowerCase();
        if (char == key1 || char == key2) // Any reason there are two of these? Removed one...
        {
            switch (beginTime) {
                case -1:
                    beginTime = Date.now();
                    $("div#status").html("Test currently running.");
                    updater = setInterval(function() {
                        update(false);
                    }, 16.6);

                    if ($("input[name='roption']:checked").val() == "time") {
                        endTimer = setTimeout(function() {
                            endTest();
                        }, timeLimit * 1000);
                    }
                default:
                    update(true);
                    break;
            }
            if ((clickTimes.length == clickLimit) && ($("input[name='roption']:checked").val() == "clicks")) {
                endTest();
                return;
            }
        }
    }
});

$(document).mousedown(function(event) {
    if ($("input[name='cmouse']").prop("checked")) {
        document.oncontextmenu = function(e) {
            stopEvent(e);
            return false;
        };

        if (event.keyCode == 13 && testRunning == false)
            beginTest();
        if (testRunning == true)
        {
            if ((event.which) == 1 || (event.which) == 3) // Any reason there are two of these? Removed one...
            {
                switch (beginTime) {
                    case -1:
                        beginTime = Date.now();
                        $("div#status").html("Test currently running.");
                        updater = setInterval(function() {
                            update(false);
                        }, 16.6);

                        if ($("input[name='roption']:checked").val() == "time") {
                            endTimer = setTimeout(function() {
                                endTest();
                            }, timeLimit * 1000);
                        }
                    default:
                        update(true);
                        break;
                }
                if ((clickTimes.length == clickLimit) && ($("input[name='roption']:checked").val() == "clicks")) {
                    endTest();
                    return;
                }
            }
        }
    } else {
        document.oncontextmenu = undefined;
    }
});

function stopEvent(event) {
    if (event.preventDefault != undefined)
        event.preventDefault();
    if (event.stopPropagation != undefined)
        event.stopPropagation();
}

$(document).ready(function() {
    if (!localStorage.getItem('clickLimit'))
        $("input#clickNum").val("20");
    else
        $("input#clickNum").val(localStorage.getItem('clickLimit'));
    if (!localStorage.getItem('key1'))
        $("input#key1").val("z");
    else
        $("input#key1").val(localStorage.getItem('key1'));
    if (!localStorage.getItem('key2'))
        $("input#key2").val("x");
    else
        $("input#key2").val(localStorage.getItem('key2'));
    if (!localStorage.getItem('timeLimit'))
        $("input#clickTime").val("10");
    else
        $("input#clickTime").val(localStorage.getItem('timeLimit'));
    if (!localStorage.getItem('mouse'))
        $("input[name='cmouse']").prop("checked", false);
    else
        $("input[name='cmouse']").prop("checked", localStorage.getItem('mouse') == "true");

    radiof(2);

    $("#chartContainer").CanvasJSChart({
        zoomEnabled: true,
        exportEnabled: true,
        title: {
            text: "BPM Chart"
        },
        axisY: {
            title: "BPM",
            includeZero: false
        },
        axisX: {
            title: "Time",
        },
        data: [{
            type: "spline",
            dataPoints: []
        }]
    });
});