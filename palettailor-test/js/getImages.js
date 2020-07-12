
/**
 * these all after are used for generating images for paper
 */

/**
 * color assignment impletementation
 */
// color assignment
function getBestColorAssignment(class_num, palette) {
    class_num = palette.length;
    let distanceOf2Colors = calculateDistOf2Colors(palette);
    let ga = new GA(new Random(Date.now()),
        class_num,
        (a, b) => a - b,
        (sigma) => E(sigma, point_distinctness_weights, contrast_to_background_weights, distanceOf2Colors),
        (x) => x, 3000);
    let sigmaAndScore = ga.compute();
    console.log("best sigma:", sigmaAndScore);
    let tmp_palette = palette.slice();
    for (let i = 0; i < palette.length; i++) {
        palette[i] = tmp_palette[sigmaAndScore.sigma[i]];
    }
    let scatterplot_svg = d3.select("#renderDiv").append("svg").attr("id", "TableauSvg")
        .attr("width", SVGWIDTH).attr("height", SVGHEIGHT);
    let scatterplot = scatterplot_svg.style("background-color", bgcolor).append("g")
        .attr("transform", "translate(" + svg_margin.left + "," + svg_margin.top + ")");
    // draw dots
    let dots = scatterplot.append("g").selectAll(".dot")
        .data(source_data)
        .enter().append("circle")
        .attr("class", "dot")
        .attr("id", function (d) {
            return "class_" + labelToClass[cValue(d)];
        })
        .attr("r", radius)
        .attr("cx", xMap)
        .attr("cy", yMap)
        .attr("fill", function (d, i) {
            return palette[labelToClass[cValue(d)]];
        });
    // console.log(ga.getTotalPopulation());

    // worst
    ga = new GA(new Random(Date.now()),
        class_num,
        (a, b) => -a + b,
        (sigma) => E(sigma, point_distinctness_weights, contrast_to_background_weights, distanceOf2Colors),
        (x) => -x, 3000);
    sigmaAndScore = ga.compute();
    console.log("worst sigma:", sigmaAndScore);
    // console.log(ga.getTotalPopulation());

    for (let i = 0; i < palette.length; i++) {
        palette[i] = tmp_palette[sigmaAndScore.sigma[i]];
    }
    scatterplot_svg = d3.select("#renderDiv").append("svg")
        .attr("width", SVGWIDTH).attr("height", SVGHEIGHT);
    scatterplot = scatterplot_svg.style("background-color", bgcolor).append("g")
        .attr("transform", "translate(" + svg_margin.left + "," + svg_margin.top + ")");
    // draw dots
    dots = scatterplot.append("g").selectAll(".dot")
        .data(source_data)
        .enter().append("circle")
        .attr("class", "dot")
        .attr("id", function (d) {
            return "class_" + labelToClass[cValue(d)];
        })
        .attr("r", radius)
        .attr("cx", xMap)
        .attr("cy", yMap)
        .attr("fill", function (d, i) {
            return palette[labelToClass[cValue(d)]];
        });
}

// Evaluation function
let lambda = .4
function E(sigma, distanceOf2Clusters, saliencyWeight, distanceOf2Colors) {
    function E_cd() {
        var score = 0;
        for (var l of distanceOf2Clusters.keys()) {
            var [i, j] = l.split(',');
            var color_pair = sigma[i] < sigma[j] ? [sigma[i], sigma[j]] : [sigma[j], sigma[i]];
            score += lambda * distanceOf2Clusters.get([i, j]) * distanceOf2Colors.get(color_pair);
        }
        return score;
    }
    function E_lc() {
        var score = 0;
        for (var i = 0; i < saliencyWeight.length; i++) {
            var tmp = (1 - lambda) * saliencyWeight[i] * distanceOf2Colors.get([sigma[i], sigma.length]);
            score += tmp;
        }
        return score;
    }
    var score_cd = E_cd(),
        score_lc = E_lc();
    // console.log(sigma.length, score_cd, score_lc);

    var score = score_cd + score_lc;
    return score;
}

/**
 * get the time versus class number
 */

let tmp_class_number_count = 3;
let tmp_iteration_count = 0;
let statics_time = [];
// draw time v.s. class number
function testTimeVSClassNumber() {
    labelToClass = {};
    for (let i = 0; i < tmp_class_number_count; i++) {
        labelToClass[i] = i;
    }
    // randomly generate data from 3 classes to 40 classes
    cd_weight = new TupleDictionary();
    for (let i = 0; i < tmp_class_number_count; i++) {
        for (let j = i + 1; j < tmp_class_number_count; j++) {
            cd_weight.put([i, j], Math.random() * 10);
        }
    }
    doColorization();
}

// get time v.s. class number
// let interval = setInterval(function () {
//     testTimeVSClassNumber();
//     if (tmp_class_number_count === 40 && tmp_iteration_count === 9) {
//         console.log(JSON.stringify(statics_time));
//         clearInterval(interval);
//     }
//     if (tmp_iteration_count === 9) {
//         tmp_class_number_count += 1;
//         tmp_iteration_count = 0;
//     }
//     else
//         tmp_iteration_count += 1;
// }, 1000);

//// draw time v.s. class number
function drawTimeVSClassNumber() {

    let linechart_svg = d3.select("#renderDiv").append("svg")
        .attr("width", SVGWIDTH).attr("height", SVGHEIGHT);
    let svg_width = SVGWIDTH - svg_margin.left - svg_margin.right,
        svg_height = SVGHEIGHT - svg_margin.top - svg_margin.bottom;

    let linechart = linechart_svg.style("background-color", bgcolor)
        .append("g")
        .attr("transform", "translate(" + svg_margin.left + "," + svg_margin.top + ")");

    // set the ranges
    let axis_x = d3.scaleLinear().range([0, svg_width]);
    let axis_y = d3.scaleLinear().range([svg_height, 0]);

    // define the line
    let valueline = d3.line()
        .x(function (d) {
            return axis_x(d[0]);
        })
        .y(function (d) {
            return axis_y(d[1]);
        }).curve(d3.curveCatmullRom);

    let raw_data = [[3, 121], [3, 70], [3, 53], [3, 82], [3, 59], [3, 80], [3, 138], [3, 156], [3, 125], [3, 96], [4, 120], [4, 160], [4, 163], [4, 131], [4, 120], [4, 183], [4, 160], [4, 130], [4, 135], [4, 135], [5, 206], [5, 240], [5, 305], [5, 194], [5, 262], [5, 291], [5, 282], [5, 218], [5, 341], [5, 1149], [6, 691], [6, 511], [6, 386], [6, 472], [6, 359], [6, 391], [6, 335], [6, 387], [6, 303], [6, 336], [7, 438], [7, 458], [7, 450], [7, 471], [7, 371], [7, 361], [7, 379], [7, 361], [7, 370], [7, 340], [8, 486], [8, 512], [8, 510], [8, 545], [8, 483], [8, 552], [8, 495], [8, 554], [8, 609], [8, 730], [9, 613], [9, 631], [9, 671], [9, 632], [9, 608], [9, 692], [9, 627], [9, 721], [9, 697], [9, 647], [10, 756], [10, 846], [10, 740], [10, 743], [10, 723], [10, 875], [10, 787], [10, 739], [10, 1024], [10, 897], [11, 960], [11, 927], [11, 1101], [11, 1004], [11, 947], [11, 905], [11, 901], [11, 896], [11, 894], [11, 942], [12, 1106], [12, 1077], [12, 1251], [12, 1111], [12, 1044], [12, 1128], [12, 1479], [12, 1346], [12, 1234], [12, 1177], [13, 1434], [13, 1331], [13, 1340], [13, 1387], [13, 1389], [13, 1417], [13, 1292], [13, 1358], [13, 1417], [13, 1349], [14, 1571], [14, 1499], [14, 1590], [14, 1614], [14, 1626], [14, 1669], [14, 1652], [14, 1678], [14, 1633], [14, 1602], [15, 1892], [15, 1918], [15, 1971], [15, 1730], [15, 1805], [15, 1821], [15, 1922], [15, 1781], [15, 1860], [15, 1848], [16, 2139], [16, 2034], [16, 1994], [16, 2022], [16, 2034], [16, 2008], [16, 2045], [16, 1986], [16, 2014], [16, 2062], [17, 2314], [17, 2362], [17, 2272], [17, 2230], [17, 2358], [17, 2242], [17, 2117], [17, 2270], [17, 2182], [17, 2360], [18, 2605], [18, 2464], [18, 2534], [18, 2587], [18, 2578], [18, 2434], [18, 2347], [18, 2280], [18, 2373], [18, 2334], [19, 2628], [19, 2700], [19, 2716], [19, 2769], [19, 2690], [19, 2584], [19, 2701], [19, 2687], [19, 2812], [19, 2807], [20, 2949], [20, 3247], [20, 3008], [20, 3028], [20, 2995], [20, 2973], [20, 3033], [20, 2942], [20, 3031], [20, 3026], [21, 3246], [21, 3259], [21, 3535], [21, 3905], [21, 3793], [21, 3157], [21, 3088], [21, 3482], [21, 3305], [21, 3341], [22, 3699], [22, 3505], [22, 3703], [22, 3478], [22, 3509], [22, 3627], [22, 3565], [22, 3591], [22, 3624], [22, 3590], [23, 3884], [23, 3850], [23, 3944], [23, 3880], [23, 3903], [23, 3811], [23, 3905], [23, 3893], [23, 3857], [23, 3872], [24, 4401], [24, 4302], [24, 4394], [24, 4298], [24, 4241], [24, 4281], [24, 4261], [24, 4263], [24, 4383], [24, 4308], [25, 4661], [25, 4660], [25, 4782], [25, 4844], [25, 4814], [25, 4548], [25, 4602], [25, 4794], [25, 4761], [25, 4605], [26, 5073], [26, 5259], [26, 5360], [26, 5421], [26, 5073], [26, 4994], [26, 5026], [26, 4907], [26, 5238], [26, 4972], [27, 5436], [27, 5536], [27, 5508], [27, 5457], [27, 5471], [27, 5534], [27, 5701], [27, 5835], [27, 5571], [27, 5568], [28, 6029], [28, 5720], [28, 5759], [28, 5896], [28, 6242], [28, 6024], [28, 5833], [28, 6015], [28, 6159], [28, 5963], [29, 6528], [29, 6671], [29, 6720], [29, 7069], [29, 6830], [29, 6803], [29, 6596], [29, 6545], [29, 6415], [29, 6402], [30, 7000], [30, 7022], [30, 6858], [30, 6875], [30, 6964], [30, 7029], [30, 6800], [30, 6885], [30, 6814], [30, 6995], [31, 7298], [31, 7535], [31, 7486], [31, 7303], [31, 7551], [31, 7488], [31, 7395], [31, 7284], [31, 7356], [31, 7543], [32, 7899], [32, 8032], [32, 7959], [32, 7826], [32, 7941], [32, 7940], [32, 8070], [32, 7728], [32, 7715], [32, 7778], [33, 10794], [33, 9796], [33, 9359], [33, 8503], [33, 8129], [33, 8275], [33, 8639], [33, 8623], [33, 8624], [33, 8477], [34, 9312], [34, 9140], [34, 9595], [34, 9178], [34, 9043], [34, 9083], [34, 8969], [34, 9010], [34, 9358], [34, 9134], [35, 9666], [35, 10031], [35, 9882], [35, 10101], [35, 10389], [35, 10014], [35, 10228], [35, 9592], [35, 10031], [35, 9864], [36, 10280], [36, 10373], [36, 10192], [36, 10076], [36, 9920], [36, 10270], [36, 9954], [36, 10397], [36, 10904], [36, 11099], [37, 10995], [37, 11356], [37, 11138], [37, 11019], [37, 10910], [37, 11360], [37, 11226], [37, 11430], [37, 11244], [37, 11021], [38, 11718], [38, 11786], [38, 11676], [38, 11456], [38, 11327], [38, 11554], [38, 11555], [38, 12183], [38, 11448], [38, 11466], [39, 12401], [39, 12106], [39, 12563], [39, 12371], [39, 12403], [39, 12313], [39, 12514], [39, 12569], [39, 12999], [39, 12719], [40, 13351], [40, 13129], [40, 13961], [40, 13548], [40, 13407], [40, 12816], [40, 13023], [40, 12839], [40, 13027], [40, 12571]]
    let data = []
    for (let i = 0; i < raw_data.length; i += 10) {
        let sum = 0;
        for (let j = 0; j < 10; j++) {
            // console.log(i, j, raw_data[i + j][0], raw_data[i + j][1]);

            sum += raw_data[i + j][1];
        }
        data.push([raw_data[i][0], sum / 10]);
    }

    // Scale the range of the data
    axis_x.domain([3, d3.extent(data, function (d) {
        return d[0];
    })[1]]);
    axis_y.domain([0, d3.extent(data, function (d) {
        return d[1];
    })[1]]);

    // Add the valueline path.
    linechart.selectAll('path')
        .data([data]).enter().append("path")
        .attr("d", valueline)
        .attr("class", "linechart")
        .attr("fill", "none")
        .attr("stroke", "#000")
        .style("stroke-width", 2);

    // Add the X Axis
    linechart.append("g")
        .attr("transform", "translate(0," + svg_height + ")")
        .call(d3.axisBottom(axis_x));

    // Add the Y Axis
    linechart.append("g")
        .call(d3.axisLeft(axis_y));

    // Appends a circle for each datapoint 
    linechart.selectAll(".dot")
        .data(data)
        .enter().append("circle") // Uses the enter().append() method
        .attr("class", "dot") // Assign a class for styling
        .attr("cx", function (d) {
            return axis_x(d[0])
        })
        .attr("cy", function (d) { return axis_y(d[1]) })
        .attr("r", 2)
        .style("stroke", "#fff")
        .style("fill", "#000");
}
// drawTimeVSClassNumber();

/**
 * get the palettes for different class number
 */
// drawPalettes()
function drawPalettes() {
    let palettes_svg = d3.select("#renderDiv").append("svg")
        .attr("width", 1200).attr("height", SVGHEIGHT);

    let palettes_legend = palettes_svg.style("background-color", bgcolor)
        .append("g")
        .attr("transform", "translate(" + svg_margin.left + "," + svg_margin.top + ")");
    let raw_data = palettes_legend_data;
    // show palettes
    for (let j = 0; j < raw_data.length; j++) {
        let palette = raw_data[j][3];
        palettes_legend.selectAll(".palettes")
            .data(palette)
            .enter().append("rect")
            .attr("width", 20)
            .attr("height", 20)
            .attr("x", function (d, i) {
                return 25 * i;
            })
            .attr("y", function () {
                return 30 * (raw_data[j][0] - 3);
            })
            .attr("fill", function (d) {
                console.log(d);

                return d3.rgb(d.r, d.g, d.b);
            });
    }
}

/**
 * get the palettes for different iteration number
 */
function drawPalettesForDifferentIterationNumber() {
    for (let i = 0; i < statics_time.length; i++) {
        let scatterplot_svg = d3.select("#renderDiv").append("svg")
            .attr("width", SVGWIDTH).attr("height", SVGHEIGHT);
        let scatterplot = scatterplot_svg.style("background-color", bgcolor).append("g")
            .attr("transform", "translate(" + svg_margin.left + "," + svg_margin.top + ")");
        // draw dots
        let dots = scatterplot.append("g").selectAll(".dot")
            .data(source_data)
            .enter().append("circle")
            .attr("class", "dot")
            .attr("id", function (d) {
                return "class_" + labelToClass[cValue(d)];
            })
            .attr("r", radius)
            .attr("cx", xMap)
            .attr("cy", yMap)
            .attr("fill", function (d) {
                // console.log(d, cValue(d), labelToClass[cValue(d)]);

                let rgb = statics_time[i][2][labelToClass[cValue(d)]];
                return d3.rgb(rgb.r, rgb.g, rgb.b);
            });
        scatterplot.append("text")
            .attr("font-family", "sans-serif")
            .attr("font-size", "16px")
            .attr("font-weight", "bold")
            .attr("x", 10)
            .attr("y", 20)
            .text(statics_time[i][0] + "-" + statics_time[i][1] + "-" + statics_time[i][3] + "ms")
    }
}

/**
 * get the teaser
 */
let bar_chart_cd_weight, scatter_cd_weight;
let bar_data;
function drawTeaser() {

    let data = [];
    for (let i of bar_data) {
        data.push([i.label, i.y]);
    }
    cd_weight = bar_chart_cd_weight;
    let used_palette = doColorization();

    let barchart_svg = d3.select("#renderDiv").append("svg")
        .attr("width", SVGWIDTH).attr("height", SVGHEIGHT);
    let svg_width = SVGWIDTH - svg_margin.left - svg_margin.right,
        svg_height = SVGHEIGHT - svg_margin.top - svg_margin.bottom;

    let barchart = barchart_svg.style("background-color", bgcolor)
        .append("g")
        .attr("transform", "translate(" + svg_margin.left + "," + svg_margin.top + ")");
    // set the ranges
    var axis_x = d3.scaleBand()
        .range([0, svg_width])
        .padding(0.1);
    var axis_y = d3.scaleLinear()
        .range([svg_height, 0]);
    // Scale the range of the data
    axis_x.domain(data.map(function (d) {
        return labelToClass[d[0]];
    }));
    axis_y.domain([0, d3.max(data, function (d) {
        return d[1];
    })]);

    // add the x Axis
    barchart.append("g")
        .attr("transform", "translate(0," + svg_height + ")")
        .call(d3.axisBottom(axis_x).tickFormat(""));

    // add the y Axis
    barchart.append("g")
        .call(d3.axisLeft(axis_y).tickFormat(""));

    barchart.selectAll("bars")
        .data(data)
        .enter().append("rect")
        .attr("class", "bars")
        .style("fill", function (d) {
            return used_palette[labelToClass[d[0]]];
        })
        .attr("x", function (d, i) {
            return axis_x(labelToClass[d[0]]);
        })
        .attr("width", axis_x.bandwidth())
        .attr("y", function (d) {
            return axis_y(d[1]);
        })
        .attr("height", function (d) {
            return svg_height - axis_y(d[1]);
        });

    // Appends a circle for each datapoint 
    barchart.selectAll(".dot")
        .data(bar_data)
        .enter().append("circle") // Uses the enter().append() method
        .attr("class", "dot") // Assign a class for styling
        .attr("cx", function (d, i) {
            return axis_x(labelToClass[d.label]) + axis_x.bandwidth() / 2;
        })
        .attr("cy", function (d) {
            return svg_height / 2 + axis_y(d.y) / 2;
        })
        .attr("r", radius)
        .style("stroke", "#fff")
        .style("fill", function (d) { return used_palette[labelToClass[d.label]] });

    cd_weight = scatter_cd_weight;
}