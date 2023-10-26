
/*
 * value accessor - returns the value to encode for a given data object.
 * scale - maps value to a visual display encoding, such as a pixel position.
 * map function - maps from data value to display value
 * axis - sets up axis
 */

// setup x
let xValue = function (d) {
    return d.x;
}; // data -> value
// setup y
let yValue = function (d) {
    return d.y;
}; // data -> value
// setup fill color
let cValue = function (d) {
    return d.label;
};

function norm255(v) {
    let normV = Math.max(0, v);
    normV = Math.min(normV, 255);
    return normV;
}
function normScope(v, vscope) {
    let normV = Math.max(vscope[0], v);
    normV = Math.min(normV, vscope[1]);
    return normV;
}

function inverseFunc(x) {
    //return Math.exp(-x);
    x = x == 0 ? 1 : x;
    return 1 / x;
}

function rgb2hcl(rgb) {
    return d3.hcl(d3.lab(rgb));
}

function hcl2rgb(hcl) {
    let color = d3.rgb(d3.lab(hcl));
    return d3.rgb(norm255(color.r), norm255(color.g), norm255(color.b));
}

//convert rgb to hex
var rgbToHex = function (rgb) {
    var hex = Number(rgb).toString(16);
    if (hex.length < 2) {
        hex = "0" + hex;
    }
    return hex;
};
var fullColorHex = function (r, g, b) {
    var red = rgbToHex(r);
    var green = rgbToHex(g);
    var blue = rgbToHex(b);
    return "#" + red + green + blue;
};

function euclidean_of_rgb(c1, c2) {
    var r_avg = (c1.r + c2.r) / 2,
        dR = c1.r - c2.r,
        dG = c1.g - c2.g,
        dB = c1.b - c2.b;
    var de = Math.sqrt(2 * dR * dR + 4 * dG * dG + 3 * dB * dB + r_avg * (dR * dR - dB * dB) / 256);

    return de;
}

class TupleDictionary {
    constructor() {
        this.dict = new Map();
    }

    tupleToString(tuple) {
        return tuple.join(",");
    }

    put(tuple, val) {
        this.dict.set(this.tupleToString(tuple), val);
    }

    get(tuple) {
        return this.dict.get(this.tupleToString(tuple));
    }

    keys() {
        return this.dict.keys();
    }

    length() {
        return this.dict.size;
    }
}

function getClassId(obj) {
    let legend_id = obj.attr("id");
    legend_id = (legend_id == undefined) ? 0 : legend_id;
    let removed_color_index = parseInt(legend_id.split("_")[1]);
    return removed_color_index;
}

//calculate distance of 2 colors
function calculateDistOf2Colors(palette) {
    let distanceOf2Colors = new TupleDictionary();
    let color_difference = function (lab1, lab2) {
        // let maxDistance = 122.48163103;
        // let minDistance = 1.02043527056;
        // let dis = (ciede2000(lab1, lab2) - minDistance) / (maxDistance - minDistance);
        let dis = d3_ciede2000(lab1, lab2)
        return dis;
    };
    let contrastToBg = function (lab1, lab2) {
        let c1 = d3.hcl(lab1),
            c2 = d3.hcl(lab2);
        if (!isNaN(c1.l) && !isNaN(c2.l)) {
            let dl = c1.l - c2.l;
            return Math.sqrt(dl * dl) / 100.0;
        } else {
            return 0;
        }
    }
    for (let i = 0; i < palette.length; i++) {
        for (let j = i + 1; j < palette.length; j++) {
            let dis = color_difference(d3.lab(palette[i]), d3.lab(palette[j]));
            distanceOf2Colors.put([i, j], dis);
        }
        distanceOf2Colors.put([i, palette.length], contrastToBg(palette[i], bgcolor));
    }
    return distanceOf2Colors;
}

function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive
}

function getLabelToClassMapping(labelSet) {
    var i = 0;
    var label2class = {};
    for (let e of labelSet.values()) {
        label2class[e] = i++;
        // label2class[e] = +e;
    }
    return label2class;
}

var resultsColorSpace = 'Hex',
    resultsQuote = '';

var colorConversionFns = {
    Hex: function (c) { c = d3.rgb(c); return fullColorHex(parseInt(c.r), parseInt(c.g), parseInt(c.b)); },
    RGB: function (c) {
        c = d3.rgb(c);
        c = [norm255(parseInt(c.r)), norm255(parseInt(c.g)), norm255(parseInt(c.b))].join(',');
        return 'rgb(' + c + ')';
    },
    Lab: function (c) { return 'Lab(' + parseInt(c.L) + ',' + parseInt(c.a) + ',' + parseInt(c.b) + ')'; },
    LCH: function (c) {
        c = d3.hcl(c);
        c = [parseInt(c.l), Math.round(c.c), Math.round(c.h)].join(',');
        return 'LCH(' + c + ')';
    },
    LCH2: function (c) {
        c = d3.hcl(c);
        c = [parseInt(c.l), Math.round(c.c), Math.round(c.h)].join(',');
        return '(' + c + ')';
    },
    HSL: function (c) {
        c = d3.hsl(c);
        c = [parseInt(c.h), c.s.toFixed(2), c.l.toFixed(2)].join(',');
        return 'HSL(' + c + ')';
    }
};

function downloadSvg() {
    // let svgEl = d3.select("#renderDiv").select("svg")._groups[0][0];
    // // let svgEl = document.getElementById(svgId);
    // svgEl.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    // var svgData = svgEl.outerHTML;
    // var preface = '<?xml version="1.0" standalone="no"?>\r\n';
    // var svgBlob = new Blob([preface, svgData], {
    //     type: "image/svg+xml;charset=utf-8"
    // });
    // // console.log(svgBlob);
    // var svgUrl = URL.createObjectURL(svgBlob);
    // var downloadLink = document.createElement("a");
    // downloadLink.href = svgUrl;
    // downloadLink.download = "result.svg";
    // downloadLink.click();
    // URL.revokeObjectURL(svgUrl);
    let scatterplot_svgs = d3.select("#renderDiv").selectAll("svg");
    scatterplot_svgs.each(function () {
        save1Svg(d3.select(this));
    });

    function save1Svg(scatterplot_svg) {
        let svgEl = scatterplot_svg._groups[0][0];
        // let svgEl = document.getElementById(svgId);
        svgEl.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        var svgData = svgEl.outerHTML;
        var preface = '<?xml version="1.0" standalone="no"?>\r\n';
        var svgBlob = new Blob([preface, svgData], {
            type: "image/svg+xml;charset=utf-8"
        });
        // console.log(svgBlob);
        var svgUrl = URL.createObjectURL(svgBlob);
        var downloadLink = document.createElement("a");
        downloadLink.href = svgUrl;
        downloadLink.download = "result.svg";
        downloadLink.click();
        URL.revokeObjectURL(svgUrl);
    }
}

function savePNG() {
    let scatterplot_svg = d3.select("#renderDiv").select("svg");
    let fileName = "result.png";
    let image = new Image;
    // get svg data
    var xml = new XMLSerializer().serializeToString(scatterplot_svg._groups[0][0]);
    // make it base64
    var svg64 = btoa(xml);
    var b64Start = 'data:image/svg+xml;base64,';
    // prepend a "header"
    var image64 = b64Start + svg64;
    //create a temporary canvas
    d3.select("#renderDiv").append("canvas").attr("id", "virtual_canvas")
        .attr("width", SVGWIDTH).attr("height", SVGHEIGHT)//.attr("style", "display:none");

    image.onload = function () {
        document.getElementById("virtual_canvas").getContext('2d').drawImage(image, 0, 0);
        var canvasElement = document.getElementById("virtual_canvas");
        var MIME_TYPE = "image/png";
        var imgURL = canvasElement.toDataURL(MIME_TYPE);

        var dlLink = document.createElement('a');
        dlLink.download = fileName;
        dlLink.href = imgURL;
        dlLink.dataset.downloadurl = [MIME_TYPE, dlLink.download, dlLink.href].join(':');

        document.body.appendChild(dlLink);
        dlLink.click();
        document.body.removeChild(dlLink);
        d3.select("#virtual_canvas").remove();
    };
    image.onerror = function () { console.log("Image failed!"); };
    // set it as the source of the img element
    image.src = image64;

}

/**
* set cookie
* @param cookName cookie name
* @param cookName cookie value
* @param expiredays expire time
*/
function setCookie(cookName, cookValue, expiredays) {
    var exdate = new Date();
    exdate.setTime(exdate.getTime() + expiredays * 24 * 3600 * 1000);
    var cookieVal = cookName + "=" + escape(cookValue) + ((expiredays == null) ? "" : ";expires=" + exdate.toGMTString()) + ";path=/";
    document.cookie = cookieVal;
}


/**
 * get cookie
 * @param cookName cookie name
 * @return
 */
function getCookie(cookName) {
    if (document.cookie.length > 0) {
        var c_start = document.cookie.indexOf(cookName + "=");
        if (c_start != -1) {
            return true;
        }
    }
    return false;
}

/**
 * delete cookie
 * @param cookName cookie name
 * @return
 */
function delCookie(cookName) {
    var exp = new Date();
    exp.setTime(exp.getTime());
    var cval = 0;
    document.cookie = cookName + "=" + cval + ";expires=" + exp.toGMTString();
}


function showTrend(data, x = 0, y = 1) {
    let linechart_svg = d3.select("#renderDiv").append("svg").attr("id", "renderSvg").attr("typeId", "line")
        .attr("width", SVGWIDTH).attr("height", SVGHEIGHT);

    let linechart = linechart_svg.style("background-color", bgcolor)
        .append("g")
        .attr("transform", "translate(" + svg_margin.left + "," + svg_margin.top + ")");

    let m_xScale = d3.scaleLinear().range([0, svg_width]), // value -> display
        m_yScale = d3.scaleLinear().range([svg_height, 0]); // value -> display
    // Scale the range of the data
    m_xScale.domain(d3.extent(data, function (d) {
        return d[x];
    }));
    m_yScale.domain(d3.extent(data, function (d) {
        return d[y];
    }));
    // define the line
    let valueline = d3.line()
        .x(function (d) {
            return m_xScale(d[x]);
        })
        .y(function (d) {
            return m_yScale(d[y]);
        })//.curve(d3.curveCatmullRom);

    let sampled_data = data
    // if (y === 1) {
    //     valueline.curve(d3.curveCatmullRom);
    // }
    let samples_num = 50
    let samples_interval = 5; Math.floor(data.length / samples_num)
    sampled_data = []
    for (let i = 0; i < data.length; i++) {
        if (i % samples_interval === 0)
            sampled_data.push(data[i])
    }
    sampled_data.push(data[data.length - 1])
    // console.log("sampled_data", sampled_data);

    // Add the valueline path.
    linechart.selectAll('path')
        .data([sampled_data]).enter().append("path")
        .attr("d", function (d) {
            return valueline(d);
        })
        .attr("class", "linechart")
        .attr("fill", "none")
        // .attr("stroke", "#444")
        .attr("stroke", function () {
            if (y === 1) {
                return "#c30d23"
            }
            return "#036eb8"
        })
        .style("stroke-width", 1)

    // Add the X Axis
    linechart.append("g")
        .attr("transform", "translate(0," + svg_height + ")")
        .call(d3.axisBottom(m_xScale)); //.tickFormat("")

    // Add the Y Axis
    linechart.append("g")
        .call(d3.axisLeft(m_yScale)); //.tickFormat("")

    linechart_svg.append("text").attr("x", 0).attr("y", 20).text("prob");
}

function checkSameNames(palette, class_number) {
    let color_names = new Set();
    for (let i = 0; i < class_number; i++) {
        color_names.add(getColorName(palette[i]))
    }
    if (color_names.size < class_number) {
        return true
    }
    return false;
}

/**
        * Shuffles array in place.
        * @param {Array} a items An array containing the items.
        */
function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

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
            // polygon._groups[0][i].setAttribute('fill', '#f5a61d');
            cell.halfedges.forEach(function (e) {
                var edge = diagram.edges[e];
                var ea = edge.left;
                if (ea === cell.site || !ea) {
                    ea = edge.right;
                }
                if (ea) {
                    // if (polygon._groups[0][ea.index].getAttribute('fill') != '#f5a61d') {
                    //     polygon._groups[0][ea.index].setAttribute('fill', '#fbe8ab');
                    // }
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
                    // if (alpha > dist) {
                    //     polygon._groups[0][ea.index].setAttribute('fill', '#fbe8ab');
                    // }
                }
            }
        });
    }
    let palette = Tableau_10_palette.slice(0, Object.keys(labelToClass).length)
    shuffle(palette)

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
        .style("fill", function (d) { return palette[labelToClass[cValue(d)]] });

}