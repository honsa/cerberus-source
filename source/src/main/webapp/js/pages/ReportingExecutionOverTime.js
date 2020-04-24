/*
 * Cerberus Copyright (C) 2013 - 2017 cerberustesting
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.
 *
 * This file is part of Cerberus.
 *
 * Cerberus is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Cerberus is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Cerberus.  If not, see <http://www.gnu.org/licenses/>.
 */
/* global handleErrorAjaxAfterTimeout */
// ChartJS Config Graphs
var configRequests = {};
var configSize = {};
var configTime = {};
var configParty = {};
var configTcTime = {};
var configTcBar = {};
// Counters of different countries, env and robotdecli (used to shorten the labels)
var nbCountries = 0;
var nbEnv = 0;
var nbRobot = 0;

$.when($.getScript("js/global/global.js")).then(function () {
    $(document).ready(function () {

        initPage();
        bindToggleCollapse();
        var urlTest = GetURLParameter('Test');
        var urlTestCase = GetURLParameter('TestCase');
        //open Run navbar Menu
        openNavbarMenu("navMenuExecutionReporting");
        $('[data-toggle="popover"]').popover({
            'placement': 'auto',
            'container': 'body'}
        );

        moment.locale("fr");

        $('#frompicker').datetimepicker();
        $('#topicker').datetimepicker({
            useCurrent: false //Important! See issue #1075
        });

        $("#frompicker").on("dp.change", function (e) {
            $('#topicker').data("DateTimePicker").minDate(e.date);
        });
        $("#topicker").on("dp.change", function (e) {
            $('#frompicker').data("DateTimePicker").maxDate(e.date);
        });


        var tests = GetURLParameters("tests");
        var testcases = GetURLParameters("testcases");
        var from = GetURLParameter("from");
        var to = GetURLParameter("to");
        var parties = GetURLParameters("parties");
        var types = GetURLParameters("types");
        var units = GetURLParameters("units");
        var environments = GetURLParameters("environments");
        var countries = GetURLParameters("countries");
        var robotDeclis = GetURLParameters("robotDeclis");

        let fromD;
        let toD;
        if (from === null) {
            fromD = new Date();
            fromD.setMonth(fromD.getMonth() - 1);
        } else {
            fromD = new Date(from);
        }
        if (to === null) {
            toD = new Date();
        } else {
            toD = new Date(to);
        }
        $('#frompicker').data("DateTimePicker").date(moment(fromD));
        $('#topicker').data("DateTimePicker").date(moment(toD));



        $("#testSelect").empty();
        $("#testCaseSelect").empty();

        $("#testSelect").bind("change", function (event) {
            feedPerfTestCase($(this).val(), "#testCaseSelect");
        });

        $("#testCaseSelect").select2({width: "100%"});


        var jqxhr = $.getJSON("ReadTest", "");
        $.when(jqxhr).then(function (data) {
            var testList = $("#testSelect");

            for (var index = 0; index < data.contentTable.length; index++) {
                testList.append($('<option></option>').text(data.contentTable[index].test).val(data.contentTable[index].test));
            }
            $("#testSelect").prop("value", tests[0]);

            $("#testSelect").select2({width: "100%"});

            feedPerfTestCase(tests[0], "#testCaseSelect", testcases[0], parties, types, units, countries, environments, robotDeclis);

        });


        var select = $("#parties");
        select.multiselect(new multiSelectConfPerf("parties"));

        var select = $("#types");
        select.multiselect(new multiSelectConfPerf("types"));

        var select = $("#units");
        select.multiselect(new multiSelectConfPerf("units"));


    });
});

function multiSelectConfPerf(name) {
    this.maxHeight = 450;
    this.checkboxName = name;
    this.buttonWidth = "100%";
    this.enableFiltering = true;
    this.enableCaseInsensitiveFiltering = true;
    this.includeSelectAllOption = true;
    this.includeSelectAllIfMoreThan = 4;
    this.numberDisplayed = 10;
}


/***
 * Feed the TestCase select with all the testcase from test defined.
 * @param {String} test - test in order to filter the testcase values.
 * @param {String} selectElement - id of select to refresh.
 * @param {String} defaultTestCase - id of testcase to select.
 * @returns {null}
 */
function feedPerfTestCase(test, selectElement, defaultTestCase, parties, types, units, countries, environments, robotDeclis) {

    var testCList = $(selectElement);
    testCList.empty();

    var jqxhr = $.getJSON("ReadTestCase", "test=" + test);
    $.when(jqxhr).then(function (data) {

        for (var index = 0; index < data.contentTable.length; index++) {
            testCList.append($('<option></option>').text(data.contentTable[index].testCase + " - " + data.contentTable[index].description).val(data.contentTable[index].testCase));
        }
        if (!isEmpty(defaultTestCase)) {
            testCList.prop("value", defaultTestCase);
        }
        loadPerfGraph(false, parties, types, units, countries, environments, robotDeclis);
    });
}


/*
 * Loading functions
 */

function initPage() {
    var doc = new Doc();
    displayHeaderLabel(doc);
    displayPageLabel(doc);
    displayFooter(doc);
    initGraph();
}

function displayPageLabel(doc) {
    $("#pageTitle").html(doc.getDocLabel("page_reportovertime", "title"));
    $("#title").html(doc.getDocOnline("page_reportovertime", "title"));
    $("#loadbutton").html(doc.getDocLabel("page_global", "buttonLoad"));
    $("#filters").html(doc.getDocOnline("page_global", "filters"));
    $("#lblPerfRequests").html(doc.getDocLabel("page_reportovertime", "lblPerfRequests"));
    $("#lblPerfSize").html(doc.getDocLabel("page_reportovertime", "lblPerfSize"));
    $("#lblPerfTime").html(doc.getDocLabel("page_reportovertime", "lblPerfTime"));
}

function loadPerfGraph(saveURLtoHistory, parties, types, units, countries, environments, robotDeclis) {
    showLoader($("#otFilterPanel"));

    if (parties === null || parties === undefined) {
        parties = [];
    }
    if (types === null || types === undefined) {
        types = [];
    }
    if (units === null || units === undefined) {
        units = [];
    }
    if (countries === null || countries === undefined) {
        countries = [];
    }
    if (environments === null || environments === undefined) {
        environments = [];
    }
    if (robotDeclis === null || robotDeclis === undefined) {
        robotDeclis = [];
    }

    let from = new Date($('#frompicker').data("DateTimePicker").date());

    let to = new Date($('#topicker').data("DateTimePicker").date());

    if ($("#parties").val() !== null) {
        parties = $("#parties").val();
    }

    if ($("#types").val() !== null) {
        types = $("#types").val();
    }

    if ($("#units").val() !== null) {
        units = $("#units").val();
    }

    if ($("#countrySelect").val() !== null) {
        countries = $("#countrySelect").val();
    }
    let len = countries.length;
    var countriesQ = "";
    for (var i = 0; i < len; i++) {
        countriesQ += "&countries=" + encodeURI(countries[i]);
    }

    if ($("#envSelect").val() !== null) {
        environments = $("#envSelect").val();
    }
    len = environments.length;
    var environmentsQ = "";
    for (var i = 0; i < len; i++) {
        environmentsQ += "&environments=" + encodeURI(environments[i]);
    }

    if ($("#robotSelect").val() !== null) {
        robotDeclis = $("#robotSelect").val();
    }
    len = robotDeclis.length;
    var robotDeclisQ = "";
    for (var i = 0; i < len; i++) {
        robotDeclisQ += "&robotDeclis=" + encodeURI(robotDeclis[i]);
    }

    len = parties.length;
    var partiQ = "";
    for (var i = 0; i < len; i++) {
        partiQ += "&parties=" + encodeURI(parties[i]);
    }

    len = types.length;
    var typeQ = "";
    for (var i = 0; i < len; i++) {
        typeQ += "&types=" + encodeURI(types[i]);
    }

    len = units.length;
    var unitQ = "";
    for (var i = 0; i < len; i++) {
        unitQ += "&units=" + encodeURI(units[i]);
    }

    let test = $("#testSelect").val();
    let testcase = $("#testCaseSelect").val();

    let qS = countriesQ + environmentsQ + robotDeclisQ + partiQ + typeQ + unitQ + "&from=" + from.toISOString() + "&to=" + to.toISOString() + "&tests=" + encodeURI(test) + "&testcases=" + encodeURI(testcase);
    if (saveURLtoHistory) {
        InsertURLInHistory("./ReportingExecutionOverTime.jsp?" + qS);
    }

    $.ajax({
        url: "ReadExecutionStat?e=1" + qS,
        method: "GET",
        async: true,
        dataType: 'json',
        success: function (data) {
            updateNbDistinct(data.distinct);
            buildGraphs(data);
            buildExeGraphs(data);
            buildExeBarGraphs(data);
            loadCombos(data);
            hideLoader($("#otFilterPanel"));
        }
    });
}

function updateNbDistinct(data) {

    nbCountries = 0;
    for (var i = 0; i < data.countries.length; i++) {
        if (data.countries[i].isRequested) {
            nbCountries++;
        }
    }
    nbEnv = 0;
    for (var i = 0; i < data.environments.length; i++) {
        if (data.environments[i].isRequested) {
            nbEnv++;
        }
    }
    nbRobot = 0;
    for (var i = 0; i < data.robotDeclis.length; i++) {
        if (data.robotDeclis[i].isRequested) {
            nbRobot++;
        }
    }
}
function setTimeRange(id) {
    let fromD;
    let toD = new Date();
    toD.setHours(23);
    toD.setMinutes(59);
    fromD = new Date();
    fromD.setHours(23);
    fromD.setMinutes(59);
    if (id === 1) { // 1 month
        fromD.setMonth(fromD.getMonth() - 1);
    } else if (id === 2) { // 3 months
        fromD.setMonth(fromD.getMonth() - 3);
    } else if (id === 3) { // 6 months
        fromD.setMonth(fromD.getMonth() - 6);
    } else if (id === 4) { //
        fromD.setMonth(fromD.getMonth() - 12);
    } else if (id === 5) {
        fromD.setHours(fromD.getHours() - 168);
    } else if (id === 6) {
        fromD.setHours(fromD.getHours() - 24);
    }
    $('#frompicker').data("DateTimePicker").date(moment(fromD));
    $('#topicker').data("DateTimePicker").date(moment(toD));
}

function loadCombos(data) {

    if (data.hasPerfdata) {
        $("#perfFilters").show();
    } else {
        $("#perfFilters").hide();
    }
    var select = $("#parties");
    select.multiselect('destroy');
    var array = data.distinct.parties;
    $("#parties option").remove();
    for (var i = 0; i < array.length; i++) {
        $("#parties").append($('<option></option>').text(array[i].name).val(array[i].name));
    }
    for (var i = 0; i < array.length; i++) {
        if (array[i].isRequested) {
            $("#parties option[value='" + array[i].name + "']").attr("selected", "selected");
        }
    }
    select.multiselect(new multiSelectConfPerf("parties"));


    var select = $("#types");
    select.multiselect('destroy');
    var array = data.distinct.types;
    $("#types option").remove();
    for (var i = 0; i < array.length; i++) {
        $("#types").append($('<option></option>').text(array[i].name).val(array[i].name));
    }
    for (var i = 0; i < array.length; i++) {
        if (array[i].isRequested) {
            $("#types option[value='" + array[i].name + "']").attr("selected", "selected");
        }
    }
    select.multiselect(new multiSelectConfPerf("types"));


    var select = $("#units");
    select.multiselect('destroy');
    var array = data.distinct.units;
    $("#units option").remove();
    for (var i = 0; i < array.length; i++) {
        $("#units").append($('<option></option>').text(array[i].name).val(array[i].name));
    }
    for (var i = 0; i < array.length; i++) {
        if (array[i].isRequested) {
            $("#units option[value='" + array[i].name + "']").attr("selected", "selected");
        }
    }
    select.multiselect(new multiSelectConfPerf("units"));

    var select = $("#countrySelect");
    select.multiselect('destroy');
    var array = data.distinct.countries;
    $("#countrySelect option").remove();
    for (var i = 0; i < array.length; i++) {
        $("#countrySelect").append($('<option></option>').text(array[i].name).val(array[i].name));
    }
    for (var i = 0; i < array.length; i++) {
        if (array[i].isRequested) {
            $("#countrySelect option[value='" + array[i].name + "']").attr("selected", "selected");
        }
    }
    select.multiselect(new multiSelectConfPerf("countrySelect"));

    var select = $("#envSelect");
    select.multiselect('destroy');
    var array = data.distinct.environments;
    $("#envSelect option").remove();
    for (var i = 0; i < array.length; i++) {
        $("#envSelect").append($('<option></option>').text(array[i].name).val(array[i].name));
    }
    for (var i = 0; i < array.length; i++) {
        if (array[i].isRequested) {
            $("#envSelect option[value='" + array[i].name + "']").attr("selected", "selected");
        }
    }
    select.multiselect(new multiSelectConfPerf("envSelect"));

    var select = $("#robotSelect");
    select.multiselect('destroy');
    var array = data.distinct.robotDeclis;
    $("#robotSelect option").remove();
    for (var i = 0; i < array.length; i++) {
        let n = array[i].name;
        if (isEmpty(n)) {
            n = "[Empty]";
        }
        $("#robotSelect").append($('<option></option>').text(n).val(array[i].name));
    }
    for (var i = 0; i < array.length; i++) {
        if (array[i].isRequested) {
            $("#robotSelect option[value='" + array[i].name + "']").attr("selected", "selected");
        }
    }
    select.multiselect(new multiSelectConfPerf("robotSelect"));

}

function getOptions(title, unit) {
    let option = {
        responsive: true,
        maintainAspectRatio: false,
        tooltips: {
            callbacks: {
                label: function (t, d) {
                    var xLabel = d.datasets[t.datasetIndex].label;
                    if (unit === "size") {
                        return xLabel + ': ' + formatNumber(Math.round(t.yLabel / 1024)) + " kb";
                    } else if (unit === "time") {
                        return xLabel + ': ' + t.yLabel.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 ") + " ms";
                    } else {
                        return xLabel + ': ' + t.yLabel;
                    }
                }
            },
            hover: {
                mode: 'index',
                intersect: false
            }
        },
        title: {
            text: title
        },
        scales: {
            xAxes: [{
                    type: 'time',
                    time: {
                        tooltipFormat: 'll HH:mm'
                    },
                    scaleLabel: {
                        display: true,
                        labelString: 'Date'
                    }
                }],
            yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: title
                    },
                    ticks: {
                        callback: function (value, index, values) {
                            if (unit === "size") {
                                return formatNumber(Math.round(value / 1024));
                            } else if (unit === "time") {
                                return value.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 ");
                            } else {
                                return value;
                            }
                        }}

                }]
        }
    };
    return option;
}

function getOptionsBar(title, unit) {
    let option = {
        responsive: true,
        maintainAspectRatio: false,
        title: {
            text: title
        },
        scales: {
            xAxes: [{
                    offset: true,
                    type: 'time',
                    stacked: true,
                    time: {
                        tooltipFormat: 'll',
                        unit: 'day',
                        round: 'day',
                        displayFormats: {
                            day: 'MMM D'
                        }},
                    scaleLabel: {
                        display: true,
                        labelString: 'Date'
                    }
                }],
            yAxes: [{
                    stacked: true,
                    ticks: {
                        beginAtZero: true
                    }
                }]
        }
    };
    return option;
}

function formatNumber(num) {
    return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
}

function buildGraphs(data) {

    let curves = data.datasetPerf;

    // Sorting values by nb of requests.
    sortedCurves = curves.sort(function (a, b) {
        let a1 = a.key.testcase.test + "-" + a.key.testcase.testcase + "-" + a.key.unit + "-" + a.key.party + "-" + a.key.type;
        let b1 = b.key.testcase.test + "-" + b.key.testcase.testcase + "-" + b.key.unit + "-" + b.key.party + "-" + b.key.type;
        return b1.localeCompare(a1);
    });

    var len = sortedCurves.length;

    let reqdatasets = [];
    let sizedatasets = [];
    let timedatasets = [];
    let partydatasets = [];

    for (var i = 0; i < len; i++) {

        let c = sortedCurves[i];
        let d = [];
        lend = c.points.length;
        for (var j = 0; j < lend; j++) {
            let p = {x: c.points[j].x, y: c.points[j].y, id: c.points[j].exe};
            d.push(p);
        }
        let lab = getLabel(c.key.testcase.description, c.key.country, c.key.environment, c.key.robotdecli, c.key.unit, c.key.party, c.key.type);
        var dataset = {
            label: lab,
            backgroundColor: get_Color_fromindex(i),
            borderColor: get_Color_fromindex(i),
//            pointBorderWidth: 0,
            pointRadius: 10,
            pointHoverRadius: 15,
            hitRadius: 10,
            fill: false,
            data: d,
            hover: {
                mode: 'index',
                intersect: false
            }

        };
        if ((c.key.unit === "totalsize") || (c.key.unit === "sizemax")) {
            sizedatasets.push(dataset);
        } else if ((c.key.unit === "totaltime") || (c.key.unit === "timemax")) {
            timedatasets.push(dataset);
        } else if (c.key.unit === "nbthirdparty") {
            partydatasets.push(dataset);
        } else {
            reqdatasets.push(dataset);
        }
    }

    if (reqdatasets.length > 0) {
        $("#panelPerfRequests").show();
    } else {
        $("#panelPerfRequests").hide();
    }
    if (sizedatasets.length > 0) {
        $("#panelPerfSize").show();
    } else {
        $("#panelPerfSize").hide();
    }
    if (timedatasets.length > 0) {
        $("#panelPerfTime").show();
    } else {
        $("#panelPerfTime").hide();
    }
    if (partydatasets.length > 0) {
        $("#panelPerfParty").show();
    } else {
        $("#panelPerfParty").hide();
    }
    configRequests.data.datasets = reqdatasets;
    configSize.data.datasets = sizedatasets;
    configTime.data.datasets = timedatasets;
    configParty.data.datasets = partydatasets;

    window.myLineReq.update();
    window.myLineSize.update();
    window.myLineTime.update();
    window.myLineParty.update();
}

function buildExeGraphs(data) {

    let curves = data.datasetExeTime;

    // Sorting values by nb of requests.
    sortedCurves = curves.sort(function (a, b) {
        let a1 = a.key.testcase.test + "-" + a.key.testcase.testcase + "-" + a.key.unit + "-" + a.key.country + "-" + a.key.environment + "-" + a.key.robotdecli;
        let b1 = b.key.testcase.test + "-" + b.key.testcase.testcase + "-" + b.key.unit + "-" + b.key.country + "-" + b.key.environment + "-" + a.key.robotdecli;
        return b1.localeCompare(a1);
    });

    var len = sortedCurves.length;

    let timedatasets = [];

    for (var i = 0; i < len; i++) {

        let c = sortedCurves[i];
        let d = [];
        lend = c.points.length;
        for (var j = 0; j < lend; j++) {
            let p = {x: c.points[j].x, y: c.points[j].y, id: c.points[j].exe, controlStatus: c.points[j].exeControlStatus};
            d.push(p);
        }
        let lab = getLabel(c.key.testcase.description, c.key.country, c.key.environment, c.key.robotdecli);
        var dataset = {
            label: lab,
            backgroundColor: "white",
            borderColor: get_Color_fromindex(i),
            pointBackgroundColor: function (d) {
                var index = d.dataIndex;
                var value = d.dataset.data[index];
                return getExeStatusRowColor(value.controlStatus);
            },
//            pointBorderWidth: 0,
            pointRadius: 10,
            pointHoverRadius: 15,
            hitRadius: 10,
            fill: false,
            data: d,
            hover: {
                mode: 'index',
                intersect: false
            }
        };
        timedatasets.push(dataset);
    }

    if (timedatasets.length > 0) {
        $("#panelTestStat").show();
    } else {
        $("#panelTestStat").hide();
    }
    configTcTime.data.datasets = timedatasets;

    window.myLineTcTime.update();
}

function buildExeBarGraphs(data) {

    let curves = data.datasetExeStatusNb;

    // Sorting values by nb of requests.
    sortedCurves = curves.sort(function (a, b) {
        let a1 = a.key.key;
        let b1 = b.key.key;
        return b1.localeCompare(a1);
    });


    var len = sortedCurves.length;

    let timedatasets = [];

    for (var i = 0; i < len; i++) {

        let c = sortedCurves[i];
        let d = [];
        lend = c.points.length;
        for (var j = 0; j < lend; j++) {
            let p = {x: c.points[j].x, y: c.points[j].y, id: c.points[j].exe, controlStatus: c.points[j].exeControlStatus};
            d.push(p);
        }
        let lab = c.key.key;
        var dataset = {
            label: lab,
            categoryPercentage: 1.0,
            barPercentage: 1.0,
            backgroundColor: getExeStatusRowColor(c.key.key),
            borderColor: getExeStatusRowColor(c.key.key),
            data: c.points
        };
        timedatasets.push(dataset);
    }

    if (timedatasets.length > 0) {
        $("#panelTestStatBar").show();
    } else {
        $("#panelTestStatBar").hide();
    }
    configTcBar.data.datasets = timedatasets;
    configTcBar.data.labels = data.datasetExeStatusNbDates;

//    console.info(configTcBar);
    window.myLineTcBar.update();
}


function getLabel(tcDesc, country, env, robot, unit, party, type) {
    let lab = tcDesc;
    if ((party !== undefined) && (party !== "total")) {
        lab += " - " + party;
    }
    if ((type !== undefined) && (type !== "total")) {
        if (lab !== "") {
            lab += " - ";
        }
        lab += type;
    }

    if (nbCountries > 1) {
        lab += " - " + country;
    }
    if (nbEnv > 1) {
        lab += " - " + env;
    }
    if (nbRobot > 1) {
        lab += " - " + robot;
    }
    if ((unit !== undefined) && (unit === "totalsize") || (unit === "sizemax") || (unit === "totaltime") || (unit === "timemax")) {
        if (lab !== "") {
            lab += " [";
        }
        lab += unit + "]";
    }

    return lab;
}

function initGraph() {

    var reqoption = getOptions("Requests", "request");
    var sizeoption = getOptions("Size in kb", "size");
    var timeoption = getOptions("Time in ms", "time");
    var partyoption = getOptions("nb Third Party", "nbthirdparty");
    var tctimeoption = getOptions("Test Case Duration", "time");
    var tcbaroption = getOptionsBar("Test Case Duration", "nb");

    let reqdatasets = [];
    let sizedatasets = [];
    let timedatasets = [];
    let partydatasets = [];
    let tctimedatasets = [];
    let tcbardatasets = [];

    configRequests = {
        type: 'line',
        data: {
            datasets: reqdatasets
        },
        options: reqoption
    };
    configSize = {
        type: 'line',
        data: {
            datasets: sizedatasets
        },
        options: sizeoption
    };
    configTime = {
        type: 'line',
        data: {
            datasets: timedatasets
        },
        options: timeoption
    };
    configParty = {
        type: 'line',
        data: {
            datasets: partydatasets
        },
        options: partyoption
    };
    configTcTime = {
        type: 'line',
        data: {
            datasets: tctimedatasets
        },
        options: tctimeoption
    };
    configTcBar = {
        type: 'bar',
        data: {
            datasets: tcbardatasets
        },
        options: tcbaroption
    };

    var ctx = document.getElementById('canvasRequests').getContext('2d');
    window.myLineReq = new Chart(ctx, configRequests);

    var ctx = document.getElementById('canvasSize').getContext('2d');
    window.myLineSize = new Chart(ctx, configSize);

    var ctx = document.getElementById('canvasTime').getContext('2d');
    window.myLineTime = new Chart(ctx, configTime);

    var ctx = document.getElementById('canvasParty').getContext('2d');
    window.myLineParty = new Chart(ctx, configParty);

    var ctx = document.getElementById('canvasTestStat').getContext('2d');
    window.myLineTcTime = new Chart(ctx, configTcTime);

    var ctx = document.getElementById('canvasTestStatBar').getContext('2d');
    window.myLineTcBar = new Chart(ctx, configTcBar);


    document.getElementById('canvasRequests').onclick = function (evt) {
        var activePoints = window.myLineReq.getElementAtEvent(event);
        // make sure click was on an actual point
        if (activePoints.length > 0) {
            let exe = window.myLineReq.data.datasets[activePoints[0]._datasetIndex].data[activePoints[0]._index].id;
            window.open('./TestCaseExecution.jsp?executionId=' + exe, '_blank');
        }
    };

    document.getElementById('canvasSize').onclick = function (evt) {
        var activePoints = window.myLineSize.getElementAtEvent(event);
        // make sure click was on an actual point
        if (activePoints.length > 0) {
            let exe = window.myLineSize.data.datasets[activePoints[0]._datasetIndex].data[activePoints[0]._index].id;
            window.open('./TestCaseExecution.jsp?executionId=' + exe, '_blank');
        }
    };

    document.getElementById('canvasTime').onclick = function (evt) {
        var activePoints = window.myLineTime.getElementAtEvent(event);
        // make sure click was on an actual point
        if (activePoints.length > 0) {
            let exe = window.myLineTime.data.datasets[activePoints[0]._datasetIndex].data[activePoints[0]._index].id;
            window.open('./TestCaseExecution.jsp?executionId=' + exe, '_blank');
        }
    };

    document.getElementById('canvasParty').onclick = function (evt) {
        var activePoints = window.myLineParty.getElementAtEvent(event);
        // make sure click was on an actual point
        if (activePoints.length > 0) {
            let exe = window.myLineParty.data.datasets[activePoints[0]._datasetIndex].data[activePoints[0]._index].id;
            window.open('./TestCaseExecution.jsp?executionId=' + exe, '_blank');
        }
    };

    document.getElementById('canvasTestStat').onclick = function (evt) {
        var activePoints = window.myLineTcTime.getElementAtEvent(event);
        // make sure click was on an actual point
        if (activePoints.length > 0) {
            let exe = window.myLineTcTime.data.datasets[activePoints[0]._datasetIndex].data[activePoints[0]._index].id;
            window.open('./TestCaseExecution.jsp?executionId=' + exe, '_blank');
        }
    };

}