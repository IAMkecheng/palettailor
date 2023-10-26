
function loadScatterplotExample() {
    d3.text("./data/scatterplot.csv", function (error, text) {
        if (error) throw error;
        DATATYPE = "SCATTERPLOT";
        d3.select("#file_label").text("scatterplot.csv");
        loadData(text);
    });
}
function loadLinechartExample() {
    d3.text("./data/linechart.csv", function (error, text) {
        if (error) throw error;
        d3.select("#file_label").text("linechart.csv");
        DATATYPE = "LINECHART";
        loadData(text);
    });
}
function loadBarchartExample() {
    d3.text("./data/barchart.csv", function (error, text) {
        if (error) throw error;
        d3.select("#file_label").text("barchart.csv");
        DATATYPE = "BARCHART";
        loadData(text);
    });
}

//open file dialog to get the file name
function F_Open_dialog(type) {
    DATATYPE = type;
    let file_btn = document.getElementById("fileLoad");
    file_btn.click();
}

//used in website
$('#fileLoad').on('change', function (e) {
    // Check for the various File API support.
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        // Great success! All the File APIs are supported.
    } else {
        alert('The File APIs are not fully supported in this browser.');
    }

    let file = e.target.files[0];
    d3.select("#file_label").text(file.name);
    var reader = new FileReader();

    // Closure to capture the file information.
    reader.onload = (function (theFile) {
        return function (e) {
            loadData(e.target.result);
        };
    })(file);

    reader.readAsText(file);
});

function loadData(text) {
    d3.select("#warn_div").style("display", "none");
    document.querySelector('#loading').classList.remove('hide');
    let labelSet = new Set();
    //parse pure text to data, and cast string to number
    source_data = d3.csvParseRows(text, function (d) {
        if (!isNaN(d[0]) && !isNaN(d[1])) {
            return d; //.map(Number);
        }
    }).map(function (d) { // change the array to an object, use the first two feature as the position
        //source data
        var row = {};
        row.label = d[2];
        labelSet.add(row.label);
        row.x = +d[0];
        row.y = +d[1];
        return row;
    });
    console.log("label set:", labelSet);
    if (labelSet.size > 100) {
        alert("Please load the data with right format.");
        document.querySelector('#loading').classList.add('hide');
        return;
    }

    labelToClass = getLabelToClassMapping(labelSet);

    d3.select("#class_num_info").text(labelSet.size);
    d3.select("#points_num_info").text(source_data.length);

    setTimeout(() => {
        if (DATATYPE === "SCATTERPLOT") {
            processScatterData(source_data);
        }
        if (DATATYPE === "BARCHART") {
            processBarData(source_data);
        }
        if (DATATYPE === "LINECHART") {
            processLineData(source_data);
        }
        d3.select(".operationDiv").style('pointer-events', "auto");
        document.querySelector('#loading').classList.add('hide');
        data_changed_sign = true;
        renderResult();
    }, 0);

}

function processScatterData(data) {
    let svg_width = SVGWIDTH - svg_margin.left - svg_margin.right,
        svg_height = SVGHEIGHT - svg_margin.top - svg_margin.bottom;
    xScale = d3.scaleLinear().range([0, svg_width]), // value -> display
        xMap = function (d) {
            return xScale(xValue(d));
        }, // data -> display
        xAxis = d3.axisBottom().scale(xScale).ticks(0);
    yScale = d3.scaleLinear().range([svg_height, 0]), // value -> display
        yMap = function (d) {
            return yScale(yValue(d));
        }, // data -> display
        yAxis = d3.axisLeft().scale(yScale).ticks(0);

    xScale.domain([d3.min(data, xValue), d3.max(data, xValue)]);
    yScale.domain([d3.min(data, yValue), d3.max(data, yValue)]);
    cd_weight = calculateAlphaShape(data, [[0, 0], [svg_width, svg_height]]);
    
    // // if already have a svg, then insert it to the history
    // addToHistory();
    // showVoronoi(data, [[0, 0], [svg_width, svg_height]]);
}

function processBarData(barcharts_source_data) {
    let data = [];
    for (let i of barcharts_source_data) {
        data.push(i.y);
    }

    let svg_width = SVGWIDTH - svg_margin.left - svg_margin.right,
        svg_height = SVGHEIGHT - svg_margin.top - svg_margin.bottom;
    // set the ranges
    var axis_x = d3.scaleBand()
        .range([0, svg_width])
        .padding(0.1);
    var axis_y = d3.scaleLinear()
        .range([svg_height, 0]);
    // Scale the range of the data
    let clusters_length = data.length;
    axis_x.domain(data.map(function (d, i) {
        return i;
    }));
    axis_y.domain(d3.extent(data, function (d) {
        return d;
    }));
    //bar chart
    let baryCenter = [];
    for (let i = 0; i < data.length; i++) {
        baryCenter.push([axis_x(i) + axis_x.bandwidth() / 2, svg_height / 2 + axis_y(data[i]) / 2]);
    }
    // only nearest two bars have a distance
    let distanceOf2Clusters = new TupleDictionary();
    let max_dist = Math.sqrt((axis_x(0) - axis_x(1)) * (axis_x(0) - axis_x(1)) + svg_height * svg_height);
    for (let i = 0; i < clusters_length - 1; i++) {
        let dist = Math.sqrt((baryCenter[i][0] - baryCenter[i + 1][0]) * (baryCenter[i][0] - baryCenter[i + 1][0]) + (baryCenter[i][1] - baryCenter[i + 1][1]) * (baryCenter[i][1] - baryCenter[i + 1][1]));
        distanceOf2Clusters.put([i, i + 1], max_dist - dist);
    }
    cd_weight = distanceOf2Clusters;

}

function processLineData(linecharts_source_data) {
    let linechart_source_data = [];
    for (let p of linecharts_source_data) {
        if (linechart_source_data[labelToClass[p.label]] == undefined) {
            linechart_source_data[labelToClass[p.label]] = { p: [], id: p.label };
        }
        linechart_source_data[labelToClass[p.label]].p.push({ x: p.x, y: p.y });
    }

    let svg_width = SVGWIDTH - svg_margin.left - svg_margin.right,
        svg_height = SVGHEIGHT - svg_margin.top - svg_margin.bottom;

    // set the ranges
    let xScale = d3.scaleLinear().range([0, svg_width]);
    let yScale = d3.scaleLinear().range([svg_height, 0]);
    xMap = function (d) {
        return xScale(xValue(d));
    },
        yMap = function (d) {
            return yScale(yValue(d));
        };

    // Scale the range of the data
    xScale.domain([d3.min(linechart_source_data, function (d) {
        return d3.min(d.p, function (e) {
            return e.x;
        });
    }), d3.max(linechart_source_data, function (d) {
        return d3.max(d.p, function (e) {
            return e.x;
        });
    })]);
    yScale.domain([d3.min(linechart_source_data, function (d) {
        return d3.min(d.p, function (e) {
            return e.y;
        });
    }), d3.max(linechart_source_data, function (d) {
        return d3.max(d.p, function (e) {
            return e.y;
        });
    })]);

    //interpolate line chart data
    let interpolated_linechart_data = [];
    let interpolated_points_step = 20;
    for (let line of linechart_source_data) {
        let line_path = line.p;
        for (let i = 0; i < line_path.length - 1; i++) {
            let x_0 = line_path[i].x, x_1 = line_path[i + 1].x;
            let y_0 = line_path[i].y, y_1 = line_path[i + 1].y;
            let interpolated_points_num = Math.floor(Math.sqrt((xScale(x_1) - xScale(x_0)) * (xScale(x_1) - xScale(x_0)) + (yScale(y_1) - yScale(y_0)) * (yScale(y_1) - yScale(y_0))) / interpolated_points_step);
            interpolated_points_num = (interpolated_points_num > 0) ? interpolated_points_num : 1;
            for (let j = 0; j < interpolated_points_num; j++) {
                interpolated_linechart_data.push({ label: line.id, x: (x_1 - x_0) * j / interpolated_points_num + x_0, y: (y_1 - y_0) * j / interpolated_points_num + y_0 });
            }
        }
        interpolated_linechart_data.push({ label: line.id, x: line_path[line_path.length - 1].x, y: line_path[line_path.length - 1].y });
    }

    cd_weight = calculateAlphaShape(interpolated_linechart_data, [[0, 0], [svg_width, svg_height]]);

    // // if already have a svg, then insert it to the history
    // addToHistory();
    // showVoronoi(interpolated_linechart_data, [[0, 0], [svg_width, svg_height]]);
}
