
function loadScatterplotExample() {
    source_datasets = [];
    source_datasets_names = [];
    // d3.text("../data/scatterplot.csv", function (error, text) {
    if (true)
        d3.text("./data/8classes.csv", function (error, text) {
            if (error) throw error;
            DATATYPE = "SCATTERPLOT";
            source_datasets_names.push("scatterplot");
            let labelSet = new Set();
            if (!loadData(text, labelSet, "scatterplot")) {
                console.log("Loading file problem.");
                return
            }

            labelToClass = getLabelToClassMapping(labelSet);
            processScatterData(source_datasets);
            d3.select(".operationDiv").style('pointer-events', "auto");
            document.querySelector('#loading').classList.add('hide');
            renderResult();
        });

    if (false) {
        // cars example: https://bl.ocks.org/jasondavies/1341281
        d3.csv("./data/cars.csv", function (error, cars) {
            if (error) throw error;
            console.log(cars);
            let source_data = []
            let labelSet = new Set();
            let getLabel = function (d) {
                return d.cylinders
            }

            for (let d of cars) {
                source_data.push({
                    x: +d["weight (lb)"],
                    y: +d['displacement (cc)'],
                    label: getLabel(d)
                })
                labelSet.add(getLabel(d))
            }
            console.log(source_data);
            source_datasets.push(source_data);
            source_datasets_names.push("cars.csv");
            labelToClass = getLabelToClassMapping(labelSet);
            console.log(labelToClass);
            processScatterData(source_datasets);
            d3.select(".operationDiv").style('pointer-events', "auto");
            document.querySelector('#loading').classList.add('hide');
            renderResult();
        });
    }

    if (false) {
        // Force 2020 Machine Learning competition: https://towardsdatascience.com/seaborn-pairplot-enhance-your-data-understanding-with-a-single-plot-bf2f44524b22
        let file_name = "Xeek_Well_15-9-15.csv"
        d3.csv("./data/" + file_name, function (error, Xeek_Well_data) {
            if (error) throw error;
            console.log(Xeek_Well_data);
            let source_data = []
            let labelSet = new Set();
            let getLabel = function (d) {
                return d["LITH"]
            }

            // for (let d of Xeek_Well_data) {
            //     if (Math.random()<0.2 && d['RHOB'] != '' && d['GR'] != '' && +d['GR'] <= 200 && d['NPHI'] != '' && d['DTC'] != '') {
            //         source_data.push({
            //             x: +d["RHOB"],
            //             y: +d['DTC'],
            //             label: getLabel(d)
            //         })
            //         labelSet.add(getLabel(d))
            //     }
            // }
            let tmp = [], output_csv = []
            for (let d of Xeek_Well_data) {
                if (Math.random() < 0.1 && d['RHOB'] != '' && d['GR'] != '' && +d['GR'] <= 120 && d['NPHI'] != '' && d['DTC'] != '') {
                    if (!tmp[getLabel(d)]) {
                        tmp[getLabel(d)] = []
                        output_csv[getLabel(d)] = []
                    }
                    tmp[getLabel(d)].push({
                        x: +d["RHOB"],
                        y: +d['NPHI'],
                        label: getLabel(d)
                    })
                    output_csv[getLabel(d)].push(d)
                    labelSet.add(getLabel(d))
                }
            }
            let arr = []
            for (let key in tmp) {
                arr.push([tmp[key].length, key])
            }
            arr.sort(function (a, b) {
                return b[0] - a[0]
            })
            output_data_global = []
            for (let a of arr) {
                source_data = source_data.concat(tmp[a[1]])
                output_data_global = output_data_global.concat(output_csv[a[1]])
            }
            // save the data
            let str = "";
            for (let key in output_data_global[0]) {
                str += key
                str += ",";
            }
            str += "\n";
            for (let i = 0; i < output_data_global.length; i++) {
                for (let key in output_data_global[i]) {
                    str += output_data_global[i][key]
                    str += ",";
                }
                str += "\n";
            }
            var aTag = document.createElement('a');
            var blob = new Blob(['\ufeff' + str], { type: "text/csv" });
            aTag.download = "Xeek_Well_data.csv";
            aTag.href = URL.createObjectURL(blob);
            aTag.click();
            URL.revokeObjectURL(blob);

            // shuffle(source_data)
            console.log(source_data);
            source_datasets.push(source_data);
            source_datasets_names.push(file_name);
            labelToClass = getLabelToClassMapping(labelSet);
            console.log(labelToClass);
            processScatterData(source_datasets);
            d3.select(".operationDiv").style('pointer-events', "auto");
            document.querySelector('#loading').classList.add('hide');
            renderResult();
        });
    }

    if (false) {
        // Force 2020 Machine Learning competition: https://towardsdatascience.com/seaborn-pairplot-enhance-your-data-understanding-with-a-single-plot-bf2f44524b22
        let file_name = "Xeek_Well_data (1).csv"
        d3.csv("./data/" + file_name, function (error, Xeek_Well_data) {
            if (error) throw error;
            console.log(Xeek_Well_data);
            let source_data = []
            let labelSet = new Set();
            let getLabel = function (d) {
                return d["LITH"]
            }
            for (let d of Xeek_Well_data) {
                if (d['RHOB'] != '' && d['GR'] != '' && +d['GR'] <= 120 && d['NPHI'] != '' && d['DTC'] != '') {
                    source_data.push({
                        x: +d["RHOB"],
                        y: +d['GR'],
                        label: getLabel(d)
                    })
                    labelSet.add(getLabel(d))
                }
            }

            // shuffle(source_data)
            console.log(source_data);
            source_datasets.push(source_data);
            source_datasets_names.push(file_name);
            labelToClass = getLabelToClassMapping(labelSet);
            console.log(labelToClass);
            processScatterData(source_datasets);
            d3.select(".operationDiv").style('pointer-events', "auto");
            document.querySelector('#loading').classList.add('hide');
            renderResult();
        });
    }

}

function loadLinechartExample() {
    source_datasets = [];
    source_datasets_names = [];
    d3.text("../data/linechart.csv", function (error, text) {
        if (error) throw error;
        DATATYPE = "LINECHART";
        source_datasets_names.push("linechart");
        let labelSet = new Set();
        if (!loadData(text, labelSet, "linechart")) {
            console.log("Loading file problem.");
            return
        }

        labelToClass = getLabelToClassMapping(labelSet);
        processLineData(source_datasets);
        d3.select(".operationDiv").style('pointer-events', "auto");
        document.querySelector('#loading').classList.add('hide');
        renderResult();
        alert("This is a feature in test! We provide you with an interactive canvas for brushing selection.")
    });
}

function loadBarchartExample() {
    source_datasets = [];
    source_datasets_names = [];
    d3.text("../data/barchart.csv", function (error, text) {
        if (error) throw error;
        DATATYPE = "BARCHART";
        source_datasets_names.push("barchart");
        let labelSet = new Set();
        if (!loadData(text, labelSet, "barchart")) {
            console.log("Loading file problem.");
            return
        }

        labelToClass = getLabelToClassMapping(labelSet);
        processBarData(source_datasets);
        d3.select(".operationDiv").style('pointer-events', "auto");
        document.querySelector('#loading').classList.add('hide');
        renderResult();
        alert("This is a feature in test! We provide you with an interactive canvas for brushing selection.")
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
    source_datasets = [];
    source_datasets_names = [];
    let labelSet = new Set();
    for (let i = 0; i < e.target.files.length; i++) {
        let file = e.target.files[i];
        var reader = new FileReader();
        reader.onload = function (event) {
            let file_name = event.target.fileName;
            if (!loadData(event.target.result, labelSet, file_name.split(".csv")[0])) {
                console.log("Loading file problem.");
                return
            }
            if (i === e.target.files.length - 1) {
                labelToClass = getLabelToClassMapping(labelSet);
                console.log(labelToClass);
                setTimeout(() => {
                    if (DATATYPE === "SCATTERPLOT") {
                        processScatterData(source_datasets);
                    }
                    if (DATATYPE === "BARCHART") {
                        processBarData(source_datasets);
                    }
                    if (DATATYPE === "LINECHART") {
                        processLineData(source_datasets);
                    }
                    d3.select(".operationDiv").style('pointer-events', "auto");
                    document.querySelector('#loading').classList.add('hide');
                    renderResult();
                }, 0);
            }
        }

        reader.fileName = file.name
        reader.readAsText(file);


    }

});

function loadData(text, labelSet, fileName) {
    // d3.select("#warn_div").style("display", "none");
    d3.select("#warn_div").text("Simulated Annealing can not always get the best result(due to limited time and randomness), if the current result is not satisfied, please run it again.")
    document.querySelector('#loading').classList.remove('hide');
    //parse pure text to data, and cast string to number
    let source_data = d3.csvParseRows(text, function (d) {
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
    // console.log("label set:", labelSet);
    if (labelSet.size > 100) {
        alert("Please load the data with right format.");
        document.querySelector('#loading').classList.add('hide');
        return false;
    }
    source_datasets.push(source_data);
    source_datasets_names.push(fileName);
    data_changed_sign = true;
    return true
}

function processScatterData(datasets) {
    xScale = d3.scaleLinear().range([0, svg_width]); // value -> display
    xMap = function (d) {
        return xScale(xValue(d));
    }; // data -> display
    xAxis = d3.axisBottom().scale(xScale).ticks(0);
    yScale = d3.scaleLinear().range([svg_height, 0]); // value -> display
    yMap = function (d) {
        return yScale(yValue(d));
    }; // data -> display
    yAxis = d3.axisLeft().scale(yScale).ticks(0);

    // using same scale
    let dataset = [];
    for (let i = 0; i < datasets.length; i++) {
        dataset = dataset.concat(datasets[i]);
    }
    xScale.domain(d3.extent(dataset, xValue));
    yScale.domain(d3.extent(dataset, yValue));

    scaled_datasets = []
    for (let i = 0; i < datasets.length; i++) {
        // // using different scale
        // xScale.domain(d3.extent(datasets[i], xValue));
        // yScale.domain(d3.extent(datasets[i], yValue));

        let tmp = []
        for (let d of datasets[i]) {
            tmp.push({
                x: xMap(d),
                y: yMap(d),
                label: d.label
            })
        }
        scaled_datasets.push(tmp)
    }

    // get cluster number for each class
    let cluster_num = Object.keys(labelToClass).length;
    cluster_nums = new Array(datasets.length)
    for (let i = 0; i < datasets.length; i++) {
        cluster_nums[i] = new Array(cluster_num).fill(0)
        var clusters = SplitDataByClass(datasets[i], labelToClass)
        for (let key in clusters) {
            if (clusters[key]) {
                cluster_nums[i][key] = clusters[key].length
            }
        }
    }

    calculateAlphaShapeDistance(scaled_datasets, [
        [0, 0],
        [svg_width, svg_height]
    ])

    // showVoronoi(datasets[0], [[0, 0], [svg_width, svg_height]]);
}

function processBarData(datasets) {
    // set the ranges
    xScale = d3.scaleBand()
        .range([0, svg_width])
        .padding(0.1);
    yScale = d3.scaleLinear()
        .range([svg_height, 0]);

    let dataset = [];
    for (let i = 0; i < datasets.length; i++) {
        dataset = dataset.concat(datasets[i]);
    }
    xScale.domain(Object.keys(labelToClass).map(function (d) {
        return d;
    }));
    yScale.domain([0, d3.max(dataset, yValue)]);

    // Scale the range of the data
    let cluster_num = Object.keys(labelToClass).length;
    alphaShape_distance = new Array(cluster_num);
    for (let i = 0; i < cluster_num; i++) {
        alphaShape_distance[i] = new Array(cluster_num).fill(0);
    }
    non_separability_weights = new Array(cluster_num).fill(0);
    let alpha_extent = [0, -10000000], beta_extent = [10000000, -10000000]
    for (let m = 0; m < datasets.length; m++) {
        //bar chart
        let baryCenter = new Array(cluster_num);
        for (let d of datasets[m]) {
            baryCenter[labelToClass[d.label]] = [xScale(d.label) + xScale.bandwidth() / 2, svg_height / 2 + yScale(d.y) / 2]
        }
        // only nearest two bars have a distance
        for (let i = 0; i < cluster_num - 1; i++) {
            let dist = Math.sqrt((baryCenter[i][0] - baryCenter[i + 1][0]) * (baryCenter[i][0] - baryCenter[i + 1][0]) + (baryCenter[i][1] - baryCenter[i + 1][1]) * (baryCenter[i][1] - baryCenter[i + 1][1]));
            alphaShape_distance[i][i + 1] = alphaShape_distance[i + 1][i] = inverseFunc(dist + 1);
            non_separability_weights[i] += inverseFunc(baryCenter[i][1] + 1);

            alpha_extent[1] = alpha_extent[1] < alphaShape_distance[i][i + 1] ? alphaShape_distance[i][i + 1] : alpha_extent[1]
            beta_extent[0] = beta_extent[0] > non_separability_weights[i] ? non_separability_weights[i] : beta_extent[0]
            beta_extent[1] = beta_extent[1] < non_separability_weights[i] ? non_separability_weights[i] : beta_extent[1]
        }
        non_separability_weights[cluster_num - 1] += 1 / baryCenter[cluster_num - 1][1];
        beta_extent[0] = beta_extent[0] > non_separability_weights[cluster_num - 1] ? non_separability_weights[cluster_num - 1] : beta_extent[0]
        beta_extent[1] = beta_extent[1] < non_separability_weights[cluster_num - 1] ? non_separability_weights[cluster_num - 1] : beta_extent[1]
    }

    // normalize the distance
    for (let i = 0; i < cluster_num; i++) {
        non_separability_weights[i] = (non_separability_weights[i] - beta_extent[0]) / (beta_extent[1] - beta_extent[0] + 0.00001)
        non_separability_weights[i] = Math.exp(non_separability_weights[i])
        for (let j = 0; j < cluster_num; j++) {
            alphaShape_distance[i][j] = (alphaShape_distance[i][j] - alpha_extent[0]) / (alpha_extent[1] - alpha_extent[0] + 0.00001)
            alphaShape_distance[i][j] = Math.exp(alphaShape_distance[i][j])
        }
    }
    console.log("alphaShape_distance:", alphaShape_distance);
    console.log("non_separability_weights:", non_separability_weights);

}

function processLineData(datasets) {
    // set the ranges
    xScale = d3.scaleLinear().range([0, svg_width]); // value -> display
    xMap = function (d) {
        return xScale(xValue(d));
    }; // data -> display
    xAxis = d3.axisBottom().scale(xScale).ticks(0);
    yScale = d3.scaleLinear().range([svg_height, 0]); // value -> display
    yMap = function (d) {
        return yScale(yValue(d));
    }; // data -> display
    yAxis = d3.axisLeft().scale(yScale).ticks(0);

    let dataset = [];
    for (let i = 0; i < datasets.length; i++) {
        dataset = dataset.concat(datasets[i]);
    }
    yScale.domain(d3.extent(dataset, function (d) {
        return d.y;
    }));
    let interpolated_datasets = [],
        x_interpolated_datasets = [];
    for (let m = 0; m < datasets.length; m++) {
        // Scale the range of the data
        xScale.domain(d3.extent(datasets[m], function (d) {
            return d.x;
        }));
        let linechart_source_data = [];
        for (let p of datasets[m]) {
            if (linechart_source_data[labelToClass[p.label]] == undefined) {
                linechart_source_data[labelToClass[p.label]] = { p: [], id: p.label };
            }
            linechart_source_data[labelToClass[p.label]].p.push({ x: p.x, y: p.y });
        }
        //interpolate line chart data
        let interpolated_linechart_data = [];
        let interpolated_points_step = 20;
        for (let line of linechart_source_data) {
            let line_path = line.p;
            for (let i = 0; i < line_path.length - 1; i++) {
                let x_0 = line_path[i].x,
                    x_1 = line_path[i + 1].x;
                let y_0 = line_path[i].y,
                    y_1 = line_path[i + 1].y;
                let interpolated_points_num = Math.floor(Math.sqrt((xScale(x_1) - xScale(x_0)) * (xScale(x_1) - xScale(x_0)) + (yScale(y_1) - yScale(y_0)) * (yScale(y_1) - yScale(y_0))) / interpolated_points_step);
                interpolated_points_num = (interpolated_points_num > 0) ? interpolated_points_num : 1;
                for (let j = 0; j < interpolated_points_num; j++) {
                    interpolated_linechart_data.push({ label: line.id, x: (x_1 - x_0) * j / interpolated_points_num + x_0, y: (y_1 - y_0) * j / interpolated_points_num + y_0 });
                }
            }
            interpolated_linechart_data.push({ label: line.id, x: line_path[line_path.length - 1].x, y: line_path[line_path.length - 1].y });
        }
        interpolated_datasets.push(interpolated_linechart_data)

        // interpolate the lines for changing distance: same x pos, get y position
        let x_interpolated_linechart_data = [];
        let x_interpolated_points_number = 40,
            x_interpolated_points_step = svg_width / x_interpolated_points_number;
        for (let line of linechart_source_data) {
            let line_path = line.p,
                x_count = 0,
                x;
            let x_0 = xScale(line_path[x_count].x),
                x_1 = xScale(line_path[x_count + 1].x);
            let y_0 = yScale(line_path[x_count].y),
                y_1 = yScale(line_path[x_count + 1].y);
            // console.log(line_path);
            for (let i = 0; i < x_interpolated_points_number; i++) {
                for (x = x_0; x < x_1; x += x_interpolated_points_step) {
                    x_interpolated_linechart_data.push({ label: line.id, x: x, y: (y_1 - y_0) * (x - x_0) / (x_1 - x_0) + y_0 });
                }
                x_count++;
                if (x_count === line_path.length - 1) break;
                if (x - x_interpolated_points_step < x_1) {
                    x_1 = xScale(line_path[x_count + 1].x);
                    y_1 = yScale(line_path[x_count + 1].y);
                    x_0 = x;
                    y_0 = (y_1 - yScale(line_path[x_count].y)) * (x - xScale(line_path[x_count].x)) / (x_1 - xScale(line_path[x_count].x)) + yScale(line_path[x_count].y);
                } else {
                    x_0 = xScale(line_path[x_count].x), x_1 = xScale(line_path[x_count + 1].x);
                    y_0 = yScale(line_path[x_count].y), y_1 = yScale(line_path[x_count + 1].y);
                }
            }
            x_interpolated_linechart_data.push({ label: line.id, x: x_1, y: y_1 });
        }
        x_interpolated_datasets.push(x_interpolated_linechart_data)
    }

    scaled_datasets = []
    for (let i = 0; i < interpolated_datasets.length; i++) {
        // using different scale
        // xScale.domain(d3.extent(datasets[i], xValue));
        // yScale.domain(d3.extent(datasets[i], yValue));

        let tmp = []
        for (let d of interpolated_datasets[i]) {
            tmp.push({
                x: xMap(d),
                y: yMap(d),
                label: d.label
            })
        }
        scaled_datasets.push(tmp)
    }

    // get cluster number for each class
    let cluster_num = Object.keys(labelToClass).length;
    cluster_nums = new Array(interpolated_datasets.length)
    for (let i = 0; i < interpolated_datasets.length; i++) {
        cluster_nums[i] = new Array(cluster_num).fill(0)
        var clusters = SplitDataByClass(interpolated_datasets[i], labelToClass)
        for (let key in clusters) {
            if (clusters[key]) {
                cluster_nums[i][key] = clusters[key].length
            }
        }
    }
    calculateAlphaShapeDistance(scaled_datasets, [
        [0, 0],
        [svg_width, svg_height]
    ])

}