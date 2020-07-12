

/**
 * alpha-Shape graph Implementation
 * using Philippe Rivière’s bl.ocks.org/1b7ddbcd71454d685d1259781968aefc 
 * voronoi.find(x,y) finds the nearest cell to the point (x,y).
 * extent is like: [[30, 30], [width - 30, height - 30]]
 */
function showVoronoi(data, extent) {
    let as_svg = d3.select("#renderDiv").append("svg").attr("id", "asIllustration")
        .attr("width", SVGWIDTH).attr("height", SVGHEIGHT);
    let svg_width = SVGWIDTH - svg_margin.left - svg_margin.right,
        svg_height = SVGHEIGHT - svg_margin.top - svg_margin.bottom;

    let asIllu = as_svg.style("background-color", bgcolor)
        .append("g")
        .attr("transform", "translate(" + svg_margin.left + "," + svg_margin.top + ")");
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

    // construct the data
    var voronoi = d3.voronoi().x(function (d) { return xMap(d); }).y(function (d) { return yMap(d); })
        .extent(extent);
    var polygon = asIllu.append("g")
        .attr("class", "polygons")
        .attr("style", "fill:none;stroke:#000")
        .selectAll("path")
        .data(voronoi.polygons(data))
        .enter().append("path")
        .call(redrawPolygon);
    var diagram = voronoi(data);
    // console.log(diagram);

    // voronoi.find is included in [d3 v4.3.0](https://github.com/d3/d3/releases/v4.3.0)
    // the following lines just add coloring
    diagram.find = function (x, y, radius) {
        var i, next = diagram.find.found || Math.floor(Math.random() * diagram.cells.length);
        var cell = diagram.cells[next] || diagram.cells[next = 0];
        var dx = x - cell.site[0],
            dy = y - cell.site[1],
            dist = dx * dx + dy * dy;

        do {
            cell = diagram.cells[i = next];
            next = null;
            polygon._groups[0][i].setAttribute('fill', '#f5a61d');
            cell.halfedges.forEach(function (e) {
                var edge = diagram.edges[e];
                var ea = edge.left;
                if (ea === cell.site || !ea) {
                    ea = edge.right;
                }
                if (ea) {
                    if (polygon._groups[0][ea.index].getAttribute('fill') != '#f5a61d') {
                        polygon._groups[0][ea.index].setAttribute('fill', '#fbe8ab');
                    }
                    var dx = x - ea[0],
                        dy = y - ea[1],
                        ndist = dx * dx + dy * dy;
                    if (ndist < dist) {
                        dist = ndist;
                        next = ea.index;
                        return;
                    }
                }
            });

        } while (next !== null);

        diagram.find.found = i;
        if (!radius || dist < radius * radius) return cell.site;
    }

    // findcell([extent[1][0] / 2, extent[1][1] / 2]);

    function moved() {
        // findcell(d3.mouse(this));
    }

    function findcell(m) {
        polygon.attr('fill', '');
        var found = diagram.find(m[0], m[1], 50);
        if (found) {
            polygon._groups[0][found.index].setAttribute('fill', 'red');
        }
    }

    function redrawPolygon(polygon) {
        polygon
            .attr("d", function (d) { return d ? "M" + d.join("L") + "Z" : null; });
    }
    // draw dots
    // let dots = scatterplot.append("g").selectAll(".dot")
    //     .data(data)
    //     .enter().append("circle")
    //     .attr("class", "dot")
    //     .attr("id", function (d) {
    //         return "class_" + labelToClass[cValue(d)];
    //     })
    //     .attr("r", radius)
    //     .attr("cx", xMap)
    //     .attr("cy", yMap)
    //     .attr("fill", function (d, i) {
    //         return Tableau_20_palette[labelToClass[cValue(d)]];
    //     });
    let cells = diagram.cells;
    let alpha = 25 * 25 * 2;
    for (let cell of cells) {
        let label = labelToClass[cell.site.data.label];
        cell.halfedges.forEach(function (e) {
            let edge = diagram.edges[e];
            let ea = edge.left;
            if (ea === cell.site || !ea) {
                ea = edge.right;
            }
            if (ea) {
                let ea_label = labelToClass[ea.data.label];
                if (label != ea_label) {
                    let dx = cell.site[0] - ea[0],
                        dy = cell.site[1] - ea[1],
                        dist = dx * dx + dy * dy;
                    if (alpha > dist) {
                        polygon._groups[0][ea.index].setAttribute('fill', '#fbe8ab');
                    }
                }
            }
        });
    }

    asIllu.selectAll(".dot2").append("g")
        .data(data)
        .enter().append("circle") // Uses the enter().append() method
        .attr("class", "dot2") // Assign a class for styling
        .attr("r", function (d) {
            if (d.terminal === 0) {
                return radius - 1;
            } else {
                return radius;
            }
        })
        .attr("cx", xMap)
        .attr("cy", yMap)
        // .style("stroke", function (d) {
        //     if (d.terminal === 0) {
        //         return "#fff";
        //     } else {
        //         return "#fff";
        //     }
        // })
        .style("fill", function (d) { return Tableau_10_palette[labelToClass[cValue(d)]] });

}

/**
 * calculate KNNG distance and non-separability weight
 * reference to "A Perception-Driven Approach to Supervised Dimensionality Reduction for Visualization"
 */
function getKNNGDistance(data) {
    function SplitDataByClass(data, label2class) {
        var clusters = {};
        for (let d of data) {
            if (clusters[label2class[d.label]] == undefined)
                clusters[label2class[d.label]] = [];
            clusters[label2class[d.label]].push({
                x: xMap(d),
                y: yMap(d)
            });
        }
        return clusters;
    }

    function getKNNG(clusters, k = 2) {
        var labels = [],
            dataset = [];
        for (var i in clusters) {
            for (var d of clusters[i]) {
                labels.push(i);
                dataset.push([d.x, d.y]);
            }
        }

        console.time('build index');
        var index = Flann.fromDataset(dataset);
        console.timeEnd('build index');
        var result = index.multiQuery(dataset, k + 1);

        return [labels, result, dataset];
    }

    function getDistanceWeightOf2Classes(labels, knng, dataset) {
        knn_graph_data = []
        var distanceDict = {};
        for (var i = 0; i < knng.length; i++) {
            for (var j in knng[i]) {
                if (labels[i] != labels[j]) {
                    if (distanceDict[labels[i]] === undefined)
                        distanceDict[labels[i]] = {};
                    if (distanceDict[labels[i]][labels[j]] === undefined)
                        distanceDict[labels[i]][labels[j]] = [];
                    distanceDict[labels[i]][labels[j]].push(inverseFunc(Math.sqrt(knng[i][j])));
                    knn_graph_data.push([dataset[i], dataset[j]]);
                }
            }
        }

        var distanceOf2Clusters = new TupleDictionary();
        for (var i in distanceDict) {
            for (var j in distanceDict[i]) {
                i = +i, j = +j;
                var dist;
                if (distanceDict[j] === undefined || distanceDict[j][i] === undefined)
                    dist = 2 * d3.sum(distanceDict[i][j]);
                else
                    dist = d3.sum(distanceDict[i][j]) + d3.sum(distanceDict[j][i]);
                if (i < j)
                    distanceOf2Clusters.put([i, j], dist);
                else
                    distanceOf2Clusters.put([j, i], dist);
            }
        }
        return distanceOf2Clusters;
    }
    //auxiliary variables
    var clusters = SplitDataByClass(data, labelToClass);
    var [labels, knng, dataset] = getKNNG(clusters, 2);

    //variables in evaluation function
    var distanceWeight = getDistanceWeightOf2Classes(labels, knng, dataset);
    return distanceWeight;
}
let knng_sign = false, cd_weight_knng, cd_weight_as;
$(document).keyup(function (event) {
    switch (event.keyCode) {
        case 32:
            knng_sign = !knng_sign;
            if (knng_sign) {
                alert('KNNG');
                cd_weight = cd_weight_knng;
            } else {
                alert('AS');
                cd_weight = cd_weight_as;
            }
            return;

    }

});

// E(P) v.s. iterations
let iteration_data = [];
function drawLineChart(data, svgId) {
    d3.select("#" + svgId).remove();
    let width = 400, height = 400;
    // set the ranges
    var axis_x = d3.scaleLinear().range([0, width]);
    var axis_y = d3.scaleLinear().range([height, 0]);

    // define the line
    var valueline = d3.line()
        .x(function (d) {
            return axis_x(d.id);
        })
        .y(function (d) {
            return axis_y(d.score);
        });//.curve(d3.curveCardinal);

    // append the svg obgect to the body of the page
    // appends a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
    let linechart_svg = d3.select("#renderDiv").append("svg")
        .attr("id", svgId)
        .attr("width", width + svg_margin.left + svg_margin.right)
        .attr("height", height + svg_margin.top + svg_margin.bottom)
        .style("background-color", bgcolor)
        .append("g")
        .attr("transform",
            "translate(" + svg_margin.left + "," + svg_margin.top + ")");

    // linechart_svg.append("text")
    //     .attr("x", 10).attr("y", 20)
    //     .attr("font-family", "sans-serif").attr("font-size", "20px").attr("fill", "red")
    //     .text(svgId);

    // Scale the range of the data
    axis_x.domain(d3.extent(data, function (d) {
        return d.id;
    }));
    axis_y.domain(d3.extent(data, function (d) {
        return d.score;
    }));

    // Add the valueline path.
    linechart_svg.append("path")
        .data([data])
        .attr("class", "line")
        .attr("d", valueline)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .style("stroke-width", "2px");

    // Add the X Axis
    linechart_svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(axis_x));

    // Add the Y Axis
    linechart_svg.append("g")
        .call(d3.axisLeft(axis_y));

}
