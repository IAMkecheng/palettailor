// Co-Saliency based Palette Generation for multiple multi-class scatterplots

d3.select(".operationDiv").style('pointer-events', "none");

document.querySelector('.instructions-container > div:last-child').onclick = () => {
    document.querySelector('.instructions-container').classList.add('hide')
}

function showHelp() {
    document.querySelector('.instructions-container').classList.remove('hide')
}

if (!getCookie("Palettailor")) {
    setCookie("Palettailor", 1, 30);
    console.log(document.cookie);
    document.querySelector('.instructions-container').classList.remove('hide');
}


function changeSlider(name, value) {
    let label_value = value / 100;
    switch (name) {
        case "slider_0":
            document.getElementById("inputBox_lc").value = value;
            score_importance_weight[0] = label_value;
            break;
        case "slider_1":
            document.getElementById("inputBox_bc").value = value;
            score_importance_weight[1] = label_value;
            break;
        case "slider_2":
            document.getElementById("inputBox_nd").value = value;
            score_importance_weight[2] = label_value;
            break;
        case "slider_3":
            document.getElementById("inputBox_nc").value = value;
            score_importance_weight[3] = label_value;
            break;
        case "inputBox_lc":
            document.getElementById("slider_0").value = value;
            score_importance_weight[0] = label_value;
            break;
        case "inputBox_bc":
            document.getElementById("slider_1").value = value;
            score_importance_weight[1] = label_value;
            break;
        case "inputBox_nd":
            document.getElementById("slider_2").value = value;
            score_importance_weight[2] = label_value;
            break;
        case "inputBox_nc":
            document.getElementById("slider_3").value = value;
            score_importance_weight[3] = label_value;
            break;
        default:
    }
}

function showSlider(name, item) {
    if (d3.select("#" + name).style("display") === 'none') {
        d3.select("#" + name).style("display", "block");
        d3.select(item).style("background-color", "#cccccc");
    } else {
        d3.select("#" + name).style("display", "none");
        d3.select(item).style("background-color", "#f6f6f6");
    }
}

c3.load("../js/lib/c3_data.json");
for (var c = 0; c < c3.color.length; ++c) {
    var x = c3.color[c];
    color_name_map[[x.L, x.a, x.b].join(",")] = c;
}

// let ccccc = d3.hcl(330, 55, 77)
// d3.select(".paletteDiv").append("span")
//     .style("width", "30px").style("height", "30px").style("display", "inline-block")
//     .style("margin-left", "10px").style("background", hcl2rgb(ccccc))
// d3.select(".paletteDiv").append("span")
//     .style("width", "30px").style("height", "30px").style("display", "inline-block")
//     .style("margin-left", "10px").style("background", ccccc)
// console.log(ccccc, hcl2rgb(ccccc), getColorNameIndex(ccccc), rgb2hcl(hcl2rgb(ccccc)), getColorNameIndex(rgb2hcl(hcl2rgb(ccccc))));

// ccccc = d3.hcl(210, 15, 17)
// d3.select(".paletteDiv").append("span")
//     .style("width", "30px").style("height", "30px").style("display", "inline-block")
//     .style("margin-left", "10px").style("background", hcl2rgb(ccccc))
// d3.select(".paletteDiv").append("span")
//     .style("width", "30px").style("height", "30px").style("display", "inline-block")
//     .style("margin-left", "10px").style("background", ccccc)
// console.log(ccccc, hcl2rgb(ccccc), getColorNameIndex(ccccc), rgb2hcl(hcl2rgb(ccccc)), getColorNameIndex(rgb2hcl(hcl2rgb(ccccc))));

// let hcl_valid_range = []
// for (let r = 0; r < 256; r++) {
//     for (let g = 0; g < 256; g++) {
//         for (let b = 0; b < 256; b++) {
//             ccccc = rgb2hcl(d3.rgb(r, g, b))
//             if (getColorNameIndex(ccccc) === undefined) {
//                 // hcl_valid_range.push([ccccc.h, ccccc.c, ccccc.l])
//                 hcl_valid_range.push(ccccc)
//             }
//         }
//     }
// }
// hcl_valid_range.sort((a, b) => a.c - b.c)
// console.log(hcl_valid_range);
// for (let i = 0; i < hcl_valid_range.length; i++) {
//     d3.select(".paletteDiv").append("span")
//         .style("width", "30px").style("height", "30px").style("display", "inline-block")
//         .style("margin-left", "10px").style("background", hcl_valid_range[i])
// }

function addToHistory() {
    d3.select("#renderDiv").selectAll("div").remove()
    let svgs = d3.select("#renderDiv").selectAll("svg");
    if (svgs._groups[0].length > 0) {
        let li = d3.select(".historyList").append("li")
            .attr("data-palette", d3.select("#paletteText").attr('data-palette'))
            .style('cursor', 'pointer')
            .on("click", function () {
                addToHistory();
                let svg = d3.select(this).selectAll("svg");
                svg.each(function () {
                    d3.select(this).attr("width", SVGWIDTH).attr("height", SVGHEIGHT);
                    d3.select("#renderDiv").node().appendChild(d3.select(this).node());
                });
                let rect = d3.select(this).selectAll(".rect");
                rect.each(function () {
                    d3.select(".paletteDiv").node().appendChild(d3.select(this).node());
                });
                d3.select(".paletteDiv").insert("br", ".rect:nth-child(" + (rect._groups[0].length / 2 + 1) + ")")
                d3.select(this).remove();
                var result = d3.select(this),
                    palette = result.attr('data-palette').split(';');
                palette = palette.map(function (c) {
                    return d3.lab(c);
                });
                outputPalette(palette);
                drawTransferFunction(palette)
            });

        // append render result
        let div = li.append("div").attr("class", "screenshot");
        svgs.each(function () {
            d3.select(this).attr("width", 80).attr("height", 80)
                .attr("preserveAspectRatio", "xMinYMin meet")
                .attr("viewBox", "0 0 " + SVGWIDTH + " " + SVGHEIGHT);
            // li.node().appendChild(d3.select(this).node());
            div.node().appendChild(d3.select(this).node());
        });

        d3.select(".paletteDiv").selectAll("br").remove()
        // append palette
        let rects = d3.select(".paletteDiv").selectAll(".rect");
        div = li.append("div").attr("class", "paletteBar");
        if (rects._groups[0].length > 0) {
            rects.each(function () {
                // li.node().appendChild(d3.select(this).node());
                div.node().appendChild(d3.select(this).node());
            });
        }

        // append delete sign
        li.append("div").attr("class", "delete_sign").append("i").attr("class", "icon_trash").style("color", "black").on("click", function () {
            li.remove();
            d3.event.stopPropagation()

        });
    }
}

function collectColorNames() {
    let color_names_checked = [];
    let inputs = d3.select("#color-names-div").selectAll("input");
    inputs.each(function () {
        // console.log(d3.select(this)._groups[0][0].value, d3.select(this)._groups[0][0].checked);
        if (d3.select(this)._groups[0][0].checked) {
            color_names_checked.push(d3.select(this)._groups[0][0].value);
        }
    });
    return color_names_checked;
}

function renderResult() {
    document.querySelector('#running').classList.remove('hide');

    setTimeout(() => {
        let palette = doColorization();;
        //scatterplot
        if (DATATYPE === "SCATTERPLOT") {
            appendScatterplot(palette);
        }

        //bar chart
        if (DATATYPE === "BARCHART") {
            appendBarchart(palette);
        }

        //line chart
        if (DATATYPE === "LINECHART") {
            appendLinechart(palette);
        }
        // appendScatterplotMatrixCars = appendScatterplotMatrix
        // appendScatterplotMatrixCars(palette)
        // let class_number = Math.floor(palette.length / 2)
        // let used_palette_0 = Tableau_10_palette.slice(0, class_number)
        // // console.log("default Tableau:", used_palette_0);
        // for (let i = 0; i < class_number; i++) {
        //     used_palette_0[i + class_number] = "#ccc"
        // }
        // appendScatterplotMatrixCars(used_palette_0)
        // // used_palette_0 = generateOptimizedAssignment(source_datasets[0], Tableau_10_palette.slice(0, class_number), class_number)
        // used_palette_0 = ['#edc948', '#4e79a7', '#f28e2b', '#e15759', '#59a14f', '#76b7b2', '#b07aa1', '#f2ebd4', '#d5dde5', '#f3e1ce', '#f0d6d7', '#d7e4d5', '#dce8e7', '#e7dde4']
        // // Tableau 10 optimized + highlighter
        // for (let i = 0; i < class_number; i++) {
        //     used_palette_0[i + class_number] = tableau_10[used_palette_0[i]]
        // }
        // appendScatterplotMatrixCars(used_palette_0)
        // console.log("optimized:", used_palette_0);

        // appendScatterplotMatrix(palette)

        // draw the palette
        appendPaletteResult(palette);
        data_changed_sign = false;

        document.querySelector('#running').classList.add('hide')
    }, 0);
}

function appendScatterplot(used_palette) {
    // used_palette = ["#c33546","#ff6acb","#0fe38f","#7e6915","#6c6a6c","#055aff","#e55300","#1070a7","#9048c3","#207c00","#f4d6da","#ffcced","#cffbea","#f7f0d3","#e5e5e5","#ccddff","#ffdecc","#d0ebfa","#e7d8f2","#d9ffcc"]
    // used_palette = ["#8b6316","#32791b","#8d3ee2","#646c69","#cc1f56","#0565dd","#217f76","#d55a00","#efd39e","#b4eaa3","#c59df0","#c4c9c7","#f09db7","#91c0fc","#a5e7e1","#ffbe8e"]
    // let palette = used_palette
    // let palette2 = palette.slice()

    // for (let key in labelToClass) {
    //     palette2[+key] = palette[labelToClass[key]]
    //     palette2[+key + palette.length / 2] = palette[labelToClass[key] + palette.length / 2]
    // }
    // console.log(JSON.stringify(palette2));


    for (let s = 0; s < source_datasets.length; s++) {
        let scatterplot_svg = d3.select("#renderDiv").append("svg").attr("id", "renderSvg").attr("typeId", "scatter")
            .attr("width", SVGWIDTH).attr("height", SVGHEIGHT);
        let scatterplot = scatterplot_svg.style("background-color", bgcolor).append("g")
            .attr("transform", "translate(" + svg_margin.left + "," + svg_margin.top + ")");

        var brush = d3.brush()
            .on("start", brushstart)
            .on("brush", brushmove)
            .on("end", brushend)
            .extent([[0, 0], [svg_width, svg_height]]);
        var brushCell;
        // Clear the previously-active brush, if any.
        function brushstart(p) {
            // console.log("brush start");
            if (brushCell !== this) {
                d3.select(brushCell).call(brush.move, null);
                brushCell = this;
            }
        }

        // Highlight the selected circles.
        function brushmove(p) {
            // console.log("brush move");
            var e = d3.brushSelection(this);

            d3.select("#renderDiv").selectAll("circle").attr("fill", function (d) {
                return !e
                    ? d3.select(this).attr("item-color")
                    : ((
                        e[0][0] > xMap(d) || xMap(d) > e[1][0]
                        || e[0][1] > yMap(d) || yMap(d) > e[1][1]
                    ) ? d3.select(this).attr("faint-color") : d3.select(this).attr("item-color"));
            });

            // opacity
            // d3.select("#renderDiv").selectAll("circle").style("opacity", function (d) {
            //     return !e
            //         ? 1
            //         : ((
            //             e[0][0] > xMap(d) || xMap(d) > e[1][0]
            //             || e[0][1] > yMap(d) || yMap(d) > e[1][1]
            //         ) ? 0.2 : 1);

            // });
        }

        // If the brush is empty, select all circles.
        function brushend() {
            // console.log("brush end");
            var e = d3.brushSelection(this);
            if (e === null) d3.select("#renderDiv").selectAll("circle").attr("fill", function (d) {
                return d3.select(this).attr("item-color")
            });
            // opacity
            // if (e === null) d3.select("#renderDiv").selectAll("circle").style("opacity", 1);
        }

        shift_click_flag = false
        d3.select("#renderDiv").on("click", function () {
            if (d3.event.shiftKey) {
                // console.log("Mouse+Shift pressed");
                if (!shift_click_flag) {
                    scatterplot.select("#point-group").raise()
                    shift_click_flag = true
                    scatterplot.selectAll("circle").attr("fill", function (d) {
                        // return used_palette[labelToClass[cValue(d)] + used_palette.length / 2];
                        return d3.select(this).attr("faint-color")
                    })
                }
            } else {
                shift_click_flag = false
                scatterplot.select("#point-group").lower()
                scatterplot.selectAll("circle").attr("fill", function (d) {
                    return d3.select(this).attr("item-color")
                    return used_palette[labelToClass[cValue(d)]];
                })
            }
        });
        // draw dots
        let dots = scatterplot.append("g").attr("id", "point-group").selectAll(".dot")
            .data(source_datasets[s])
            .enter().append("circle")
            .attr("class", "dot")
            .attr("id", function (d) {
                return "class_" + labelToClass[cValue(d)];
            })
            .attr("r", radius)
            .attr("cx", xMap)
            .attr("cy", yMap)
            .attr("fill", function (d) {
                return used_palette[labelToClass[cValue(d)]];
            })
            .attr("item-color", function (d) {
                return used_palette[labelToClass[cValue(d)]];
            })
            .attr("faint-color", function (d) {
                return used_palette[labelToClass[cValue(d)] + used_palette.length / 2];
            })
            .on("click", function () {
                // console.log("click point");
                d3.select(this).attr("fill", function (d) {
                    return used_palette[labelToClass[cValue(d)]];
                }).raise();
            })
        // .on("mouseenter", function (d) {
        //     updateSvg(used_palette, scatterplot_svg, labelToClass[cValue(d)])
        // }).on("mouseleave", function () {
        //     updateSvg(used_palette, scatterplot_svg, -1)
        // })
        // .on("click", function (d) {
        //     // set status
        //     d3.select("#tfInfoLabel").select("#icon_lock-" + labelToClass[cValue(d)]).attr("class", "icon_box-checked")
        //     updateSvg(used_palette, scatterplot_svg, labelToClass[cValue(d)])
        // })
        // .on("dblclick", function (d) {
        //     // double click to cancel highlighting
        //     d3.select("#tfInfoLabel").select("#icon_lock-" + labelToClass[cValue(d)]).attr("class", "icon_box-empty")
        //     updateSvg(used_palette, scatterplot_svg, -1)
        // })

        scatterplot.call(brush);
        // add the x Axis
        scatterplot.append("g")
            .attr("transform", "translate(0," + svg_height + ")")
            .call(d3.axisBottom(xScale)); //.tickFormat("")

        // add the y Axis
        scatterplot.append("g")
            .call(d3.axisLeft(yScale)); //.tickFormat("")

        scatterplot_svg.append("text").attr("x", 0).attr("y", 20).text(source_datasets_names[s]);

        scatterplot_svg.select(".selection").style("fill-opacity", 0).style("stroke", "#ccc").style("stroke-width", "4")
    }
}

function updateSvg(palette, svg, classId) {
    let typeId = svg.attr("typeId")
    if (typeId != "line") {
        for (let i = 0; i < palette.length / 2; i++) {
            if (classId != -1 && classId != i && d3.select("#tfInfoLabel").select("#icon_lock-" + i).attr("class") != "icon_box-checked")
                svg.selectAll("#class_" + i)
                    .attr("fill", function () {
                        return palette[i + palette.length / 2];
                    })
                    .attr("item-color", function () {
                        return palette[i + palette.length / 2];
                    })
            else {
                svg.selectAll("#class_" + i)
                    .attr("fill", function () {
                        return palette[i];
                    })
                    .attr("item-color", function () {
                        return palette[i];
                    })
                    .raise(); // https://stackoverflow.com/questions/24045673/reorder-elements-of-svg-z-index-in-d3-js
            }

        }
    }
    else {
        for (let i = 0; i < palette.length / 2; i++) {
            if (classId != -1 && classId != i && d3.select("#tfInfoLabel").select("#icon_lock-" + i).attr("class") != "icon_box-checked")
                svg.selectAll("#class_" + i)
                    .attr("stroke", function () {
                        return palette[i + palette.length / 2];
                    })
                    .attr("item-color", function () {
                        return palette[i + palette.length / 2];
                    })
            else {
                svg.selectAll("#class_" + i)
                    .attr("stroke", function () {
                        return palette[i];
                    })
                    .attr("item-color", function () {
                        return palette[i];
                    })
                    .raise(); // https://stackoverflow.com/questions/24045673/reorder-elements-of-svg-z-index-in-d3-js
            }

        }
    }
}

function appendBarchart2(used_palette) {
    // let used_palette = doColorization();
    xScale.domain(Object.keys(labelToClass).map(function (d) {
        return d;
    }));
    for (let s = 0; s < source_datasets.length; s++) {
        yScale.domain([0, d3.max(source_datasets[s], yValue)]);
        let barchart_svg = d3.select("#renderDiv").append("svg").attr("id", "renderSvg").attr("typeId", "bar")
            .attr("width", SVGWIDTH).attr("height", SVGHEIGHT);

        let barchart = barchart_svg.style("background-color", bgcolor)
            .append("g")
            .attr("transform", "translate(" + svg_margin.left + "," + svg_margin.top + ")");

        // add the x Axis
        barchart.append("g")
            .attr("transform", "translate(0," + svg_height + ")")
            .call(d3.axisBottom(xScale)); //.tickFormat("")

        // add the y Axis
        barchart.append("g")
            .call(d3.axisLeft(yScale)); //.tickFormat("")

        barchart.selectAll("bars")
            .data(source_datasets[s])
            .enter().append("rect")
            .attr("class", "bars")
            .attr("id", function (d) {
                return "class_" + labelToClass[cValue(d)];
            })
            .attr("fill", function (d) {
                return used_palette[labelToClass[cValue(d)]];
            })
            .attr("x", function (d) {
                return xScale(cValue(d));
            })
            .attr("width", xScale.bandwidth())
            .attr("y", function (d) {
                return yScale(yValue(d));
            })
            .attr("height", function (d) {
                return svg_height - yScale(yValue(d));
            })
            // .attr("x", function (d) {
            //     return yScale(0);
            // })
            // .attr("width", function (d) { return yScale(yValue(d)) })
            // .attr("y", function (d) {
            //     return xScale(cValue(d));
            // })
            // .attr("height", function (d) {
            //     return xScale.bandwidth();
            // })
            .attr("rx", 10).attr("ry", 10)
            .attr("item-color", function (d) {
                return used_palette[labelToClass[cValue(d)]];
            })
            .attr("faint-color", function (d) {
                return used_palette[labelToClass[cValue(d)] + used_palette.length / 2];
            })
            .on("mouseenter", function (d) {
                updateSvg(used_palette, barchart_svg, labelToClass[cValue(d)])
            }).on("mouseleave", function () {
                updateSvg(used_palette, barchart_svg, -1)
            })
            .on("click", function (d) {
                updateSvg(used_palette, barchart_svg, labelToClass[cValue(d)])
                // set status
                d3.select("#tfInfoLabel").select("#icon_lock-" + labelToClass[cValue(d)]).attr("class", "icon_box-checked")
            })
            .on("dblclick", function (d) {
                // double click to cancel highlighting
                d3.select("#tfInfoLabel").select("#icon_lock-" + labelToClass[cValue(d)]).attr("class", "icon_box-empty")
                updateSvg(used_palette, barchart_svg, -1)
            })
        // .on("click", appendClickEvent);
        barchart_svg.append("text").attr("x", 0).attr("y", 20).text(source_datasets_names[s]);
        transferSvgToCanvas(barchart_svg, used_palette)
    }
    // return used_palette;
}
function appendBarchart(used_palette) {
    // let used_palette = doColorization();
    xScale.domain(Object.keys(labelToClass).map(function (d) {
        return d;
    }));
    for (let s = 0; s < source_datasets.length; s++) {
        yScale.domain([0, d3.max(source_datasets[s], yValue)]);
        let barchart_svg = d3.select("#renderDiv").append("svg").attr("id", "renderSvg").attr("typeId", "bar")
            .attr("width", SVGWIDTH).attr("height", SVGHEIGHT);

        let barchart = barchart_svg.style("background-color", bgcolor)
            .append("g")
            .attr("transform", "translate(" + svg_margin.left + "," + svg_margin.top + ")");

        var brush = d3.brush()
            .on("start", brushstart)
            .on("brush", brushmove)
            .on("end", brushend)
            .extent([[0, 0], [svg_width, svg_height]]);
        var brushCell;
        // Clear the previously-active brush, if any.
        function brushstart(p) {
            // console.log("brush start");
            if (brushCell !== this) {
                d3.select(brushCell).call(brush.move, null);
                brushCell = this;
            }
        }

        var clip = barchart_svg.append("defs").append("svg:clipPath")
            .attr("id", "clip")
            .append("svg:rect")
            .attr("width", svg_width)
            .attr("height", svg_height)
            .attr("x", 0)
            .attr("y", 0);

        var focus_chart = barchart_svg.append("g")
            .attr("class", "focus")
            .attr("transform", "translate(" + svg_margin.left + "," + svg_margin.top + ")")
            .attr("clip-path", "url(#clip)");

        // Highlight the selected circles.
        function brushmove(p) {
            // console.log("brush move");
            var e = d3.brushSelection(this);
            let x, y, width, height
            if (!e) {
                x = 0
                y = 0
                width = svg_width
                height = svg_height
            } else {
                x = e[0][0]
                y = e[0][1]
                width = e[1][0] - x
                height = e[1][1] - y
            }
            clip.attr("width", width)
                .attr("height", height)
                .attr("x", x)
                .attr("y", y);
        }

        // If the brush is empty, select all circles.
        function brushend() {
            // console.log("brush end");
            var e = d3.brushSelection(this);
            if (e === null) {
                focus_chart.selectAll('.barchart-focus').attr("fill", function (d) {
                    return d3.select(this).attr("item-color")
                })
                clip.attr("width", svg_width)
                    .attr("height", svg_height)
                    .attr("x", 0)
                    .attr("y", 0);
            }
        }


        // add the x Axis
        barchart.append("g")
            .attr("transform", "translate(0," + svg_height + ")")
            .call(d3.axisBottom(xScale)); //.tickFormat("")

        // add the y Axis
        barchart.append("g")
            .call(d3.axisLeft(yScale)); //.tickFormat("")

        barchart.selectAll("bars")
            .data(source_datasets[s])
            .enter().append("rect")
            .attr("class", "bars")
            .attr("id", function (d) {
                return "faint-class_" + labelToClass[cValue(d)];
            })
            .attr("fill", function (d) {
                return used_palette[labelToClass[cValue(d)] + used_palette.length / 2];
            })
            .attr("x", function (d) {
                return xScale(cValue(d));
            })
            .attr("width", xScale.bandwidth())
            .attr("y", function (d) {
                return yScale(yValue(d));
            })
            .attr("height", function (d) {
                return svg_height - yScale(yValue(d));
            })
            .attr("rx", 10).attr("ry", 10)
        focus_chart.selectAll("barchart-focus")
            .data(source_datasets[s])
            .enter().append("rect")
            .attr("class", "barchart-focus")
            .attr("id", function (d) {
                return "class_" + labelToClass[cValue(d)];
            })
            .attr("fill", function (d) {
                return used_palette[labelToClass[cValue(d)]];
            })
            .attr("x", function (d) {
                return xScale(cValue(d));
            })
            .attr("width", xScale.bandwidth())
            .attr("y", function (d) {
                return yScale(yValue(d));
            })
            .attr("height", function (d) {
                return svg_height - yScale(yValue(d));
            })
            .attr("rx", 10).attr("ry", 10)
            .attr("item-color", function (d) {
                return used_palette[labelToClass[cValue(d)]];
            })
            .attr("faint-color", function (d) {
                return used_palette[labelToClass[cValue(d)] + used_palette.length / 2];
            })
        barchart_svg.append("text").attr("x", 0).attr("y", 20).text(source_datasets_names[s]);


        barchart.call(brush);
        barchart_svg.select(".selection").style("fill-opacity", 0).style("stroke", "#ccc").style("stroke-width", "4")
    }
    // return used_palette;
}

function appendLinechart2(used_palette) {
    // let used_palette = doColorization();
    for (let s = 0; s < source_datasets.length; s++) {
        let linechart_svg = d3.select("#renderDiv").append("svg").attr("id", "renderSvg").attr("typeId", "line")
            .attr("width", SVGWIDTH).attr("height", SVGHEIGHT);

        let linechart = linechart_svg.style("background-color", bgcolor)
            .append("g")
            .attr("transform", "translate(" + svg_margin.left + "," + svg_margin.top + ")");


        var brush = d3.brush()
            .on("start", brushstart)
            .on("brush", brushmove)
            .on("end", brushend)
            .extent([[0, 0], [svg_width, svg_height]]);
        var brushCell;
        // Clear the previously-active brush, if any.
        function brushstart(p) {
            // console.log("brush start");
            if (brushCell !== this) {
                d3.select(brushCell).call(brush.move, null);
                brushCell = this;
            }
        }

        // Highlight the selected circles.
        function brushmove(p) {
            // console.log("brush move");
            var e = d3.brushSelection(this);

            let linechart_source_data_tmp = [];
            for (let line of linechart_source_data) {
                linechart_source_data_tmp[labelToClass[line.label]] = { p: [], label: line.label }
                for (let d of line.p) {
                    if (e[0][0] > xMap(d) || xMap(d) > e[1][0]
                        || e[0][1] > yMap(d) || yMap(d) > e[1][1]) {
                        continue
                    }
                    linechart_source_data_tmp[labelToClass[line.label]].p.push(d)
                }
            }
            // console.log(linechart_source_data, linechart_source_data_tmp);

            linechart.selectAll('.linechart').attr("stroke", function (d) {
                return d3.select(this).attr("faint-color")
            })
            // Add the selected path.
            linechart.selectAll('.linechart-salient').remove()
            linechart.selectAll('.linechart-salient')
                .data(linechart_source_data_tmp).enter().append("path")
                .attr("d", function (d) {
                    return valueline(d.p);
                })
                .attr("class", "linechart-salient")
                .attr("fill", "none")
                .attr("stroke", function (d) {
                    return used_palette[labelToClass[cValue(d)]];
                })
                .style("stroke-width", radius)
            console.log(linechart.selectAll('.linechart-salient'));
        }

        // If the brush is empty, select all circles.
        function brushend() {
            // console.log("brush end");
            var e = d3.brushSelection(this);
            if (e === null) {
                linechart.selectAll('.linechart-salient').remove()
                linechart.selectAll('.linechart').attr("stroke", function (d) {
                    return d3.select(this).attr("item-color")
                })
            }
        }

        // Scale the range of the data
        xScale.domain(d3.extent(source_datasets[s], function (d) {
            return d.x;
        }));
        // define the line
        let valueline = d3.line()
            .x(function (d) {
                return xScale(d.x);
            })
            .y(function (d) {
                return yScale(d.y);
            })//.curve(d3.curveCatmullRom);

        let linechart_source_data = [],
            tmp_keys = [],
            count = 0;
        // for (let point of source_datasets[s]) {
        //     if (tmp_keys[labelToClass[point.label]] == undefined) {
        //         tmp_keys[labelToClass[point.label]] = count++;
        //         linechart_source_data[tmp_keys[labelToClass[point.label]]] = { p: [], label: point.label };
        //     }
        //     linechart_source_data[tmp_keys[labelToClass[point.label]]].p.push({ x: point.x, y: point.y });
        // }
        for (let point of source_datasets[s]) {
            if (linechart_source_data[labelToClass[point.label]] == undefined) {
                linechart_source_data[labelToClass[point.label]] = { p: [], label: point.label };
            }
            linechart_source_data[labelToClass[point.label]].p.push({ x: point.x, y: point.y });
        }
        //interpolate line chart data
        let interpolated_linechart_data = [];
        let interpolated_points_step = 10;
        for (let line of linechart_source_data) {
            let line_path = line.p;
            interpolated_linechart_data[labelToClass[line.label]] = { p: [], label: line.label };
            for (let i = 0; i < line_path.length - 1; i++) {
                let x_0 = line_path[i].x,
                    x_1 = line_path[i + 1].x;
                let y_0 = line_path[i].y,
                    y_1 = line_path[i + 1].y;
                let interpolated_points_num = Math.floor(Math.sqrt((xScale(x_1) - xScale(x_0)) * (xScale(x_1) - xScale(x_0)) + (yScale(y_1) - yScale(y_0)) * (yScale(y_1) - yScale(y_0))) / interpolated_points_step);
                interpolated_points_num = (interpolated_points_num > 0) ? interpolated_points_num : 1;
                for (let j = 0; j < interpolated_points_num; j++) {
                    interpolated_linechart_data[labelToClass[line.label]].p.push({ label: line.label, x: (x_1 - x_0) * j / interpolated_points_num + x_0, y: (y_1 - y_0) * j / interpolated_points_num + y_0 });
                }
            }
            interpolated_linechart_data[labelToClass[line.label]].p.push({ label: line.label, x: line_path[line_path.length - 1].x, y: line_path[line_path.length - 1].y });
        }
        linechart_source_data = interpolated_linechart_data
        // console.log("interpolated_linechart_data", interpolated_linechart_data);
        // Add the valueline path.
        linechart.selectAll('path')
            .data(linechart_source_data).enter().append("path")
            .attr("d", function (d) {
                return valueline(d.p);
            })
            .attr("class", "linechart")
            .attr("id", function (d) {
                return "class_" + labelToClass[cValue(d)];
            })
            .attr("fill", "none")
            .attr("stroke", function (d) {
                return used_palette[labelToClass[cValue(d)]];
            })
            .style("stroke-width", radius)
            .attr("item-color", function (d) {
                return used_palette[labelToClass[cValue(d)]];
            })
            .attr("faint-color", function (d) {
                return used_palette[labelToClass[cValue(d)] + used_palette.length / 2];
            })
            .on("mouseenter", function (d) {
                updateSvg(used_palette, linechart_svg, labelToClass[cValue(d)])
            }).on("mouseleave", function () {
                updateSvg(used_palette, linechart_svg, -1)
            })
            .on("click", function (d) {
                updateSvg(used_palette, linechart_svg, labelToClass[cValue(d)])
                // set status
                d3.select("#tfInfoLabel").select("#icon_lock-" + labelToClass[cValue(d)]).attr("class", "icon_box-checked")
            })
            .on("dblclick", function (d) {
                // double click to cancel highlighting
                d3.select("#tfInfoLabel").select("#icon_lock-" + labelToClass[cValue(d)]).attr("class", "icon_box-empty")
                updateSvg(used_palette, linechart_svg, -1)
            })
        // .on("click", appendClickEvent);

        linechart.call(brush);
        // Add the X Axis
        linechart.append("g")
            .attr("transform", "translate(0," + svg_height + ")")
            .call(d3.axisBottom(xScale)); //.tickFormat("")

        // Add the Y Axis
        linechart.append("g")
            .call(d3.axisLeft(yScale)); //.tickFormat("")

        linechart_svg.append("text").attr("x", 0).attr("y", 20).text(source_datasets_names[s]);

        // transferSvgToCanvas(linechart_svg, used_palette)

        linechart_svg.select(".selection").style("fill-opacity", 0).style("stroke", "#ccc").style("stroke-width", "4")
    }
    // return used_palette;
}

function appendLinechart(used_palette) {
    // let used_palette = doColorization();
    for (let s = 0; s < source_datasets.length; s++) {
        let linechart_svg = d3.select("#renderDiv").append("svg").attr("id", "renderSvg").attr("typeId", "line")
            .attr("width", SVGWIDTH).attr("height", SVGHEIGHT);

        let linechart = linechart_svg.style("background-color", bgcolor)
            .append("g")
            .attr("transform", "translate(" + svg_margin.left + "," + svg_margin.top + ")");

        var brush = d3.brush()
            .on("start", brushstart)
            .on("brush", brushmove)
            .on("end", brushend)
            .extent([[0, 0], [svg_width, svg_height]]);
        var brushCell;
        // Clear the previously-active brush, if any.
        function brushstart(p) {
            // console.log("brush start");
            if (brushCell !== this) {
                d3.select(brushCell).call(brush.move, null);
                brushCell = this;
            }
        }

        var clip = linechart_svg.append("defs").append("svg:clipPath")
            .attr("id", "clip")
            .append("svg:rect")
            .attr("width", svg_width)
            .attr("height", svg_height)
            .attr("x", 0)
            .attr("y", 0);

        var focus_chart = linechart_svg.append("g")
            .attr("class", "focus")
            .attr("transform", "translate(" + svg_margin.left + "," + svg_margin.top + ")")
            .attr("clip-path", "url(#clip)");

        // Highlight the selected circles.
        function brushmove(p) {
            // console.log("brush move");
            var e = d3.brushSelection(this);
            let x, y, width, height
            if (!e) {
                x = 0
                y = 0
                width = svg_width
                height = svg_height
            } else {
                x = e[0][0]
                y = e[0][1]
                width = e[1][0] - x
                height = e[1][1] - y
            }
            clip.attr("width", width)
                .attr("height", height)
                .attr("x", x)
                .attr("y", y);
        }

        // If the brush is empty, select all circles.
        function brushend() {
            // console.log("brush end");
            var e = d3.brushSelection(this);
            if (e === null) {
                focus_chart.selectAll('.linechart-focus').attr("stroke", function (d) {
                    return d3.select(this).attr("item-color")
                })
                clip.attr("width", svg_width)
                    .attr("height", svg_height)
                    .attr("x", 0)
                    .attr("y", 0);
            }
        }

        // Scale the range of the data
        xScale.domain(d3.extent(source_datasets[s], function (d) {
            return d.x;
        }));
        // define the line
        let valueline = d3.line()
            .x(function (d) {
                return xScale(d.x);
            })
            .y(function (d) {
                return yScale(d.y);
            }).curve(d3.curveCatmullRom);

        let linechart_source_data = []
        for (let point of source_datasets[s]) {
            if (linechart_source_data[labelToClass[point.label]] == undefined) {
                linechart_source_data[labelToClass[point.label]] = { p: [], label: point.label };
            }
            linechart_source_data[labelToClass[point.label]].p.push({ x: point.x, y: point.y });
        }

        // Add the valueline path.
        linechart.selectAll('.linechart')
            .data(linechart_source_data).enter().append("path")
            .attr("d", function (d) {
                return valueline(d.p);
            })
            .attr("class", "linechart")
            .attr("id", function (d) {
                return "faint-class_" + labelToClass[cValue(d)];
            })
            .attr("fill", "none")
            .attr("stroke", function (d) {
                return used_palette[labelToClass[cValue(d)] + used_palette.length / 2];
            })
            .style("stroke-width", radius)
        focus_chart.selectAll('.linechart-focus')
            .data(linechart_source_data).enter().append("path")
            .attr("d", function (d) {
                return valueline(d.p);
            })
            .attr("class", "linechart-focus")
            .attr("id", function (d) {
                return "class_" + labelToClass[cValue(d)];
            })
            .attr("fill", "none")
            .attr("stroke", function (d) {
                return used_palette[labelToClass[cValue(d)]];
            })
            .style("stroke-width", radius)
            .attr("item-color", function (d) {
                return used_palette[labelToClass[cValue(d)]];
            })
            .attr("faint-color", function (d) {
                return used_palette[labelToClass[cValue(d)] + used_palette.length / 2];
            })

        linechart.call(brush);
        // Add the X Axis
        linechart.append("g")
            .attr("transform", "translate(0," + svg_height + ")")
            .call(d3.axisBottom(xScale)); //.tickFormat("")

        // Add the Y Axis
        linechart.append("g")
            .call(d3.axisLeft(yScale)); //.tickFormat("")

        linechart_svg.append("text").attr("x", 0).attr("y", 20).text(source_datasets_names[s]);

        // transferSvgToCanvas(linechart_svg, used_palette)

        linechart_svg.select(".selection").style("fill-opacity", 0).style("stroke", "#ccc").style("stroke-width", "4")
    }
    // return used_palette;
}
/**
 * https://bl.ocks.org/mbostock/0d20834e3d5a46138752f86b9b79727e
 * @param {*} svg 
 * @param {*} used_palette 
 */
function transferSvgToCanvas(svg, used_palette) {
    let used_colors = [], class_number = used_palette.length / 2
    for (let i = 0; i < class_number; i++) {
        used_colors.push([d3.rgb(used_palette[i]), d3.rgb(used_palette[i + class_number])])
    }
    console.log(used_colors);
    d3.select("#renderDiv").selectAll("div").remove()
    let div = d3.select("#renderDiv").append("div").attr("id", "canvasDiv")
    div.append("canvas").attr("width", SVGWIDTH).attr("height", SVGHEIGHT)
    let brush_svg = div.append("svg").attr("width", SVGWIDTH).attr("height", SVGHEIGHT)

    // render canvas
    let image = new Image;
    // get svg data
    var xml = new XMLSerializer().serializeToString(svg._groups[0][0]);

    // make it base64
    var svg64 = btoa(xml);
    var b64Start = 'data:image/svg+xml;base64,';

    // prepend a "header"
    var image64 = b64Start + svg64;

    image.onload = function () {
        // draw the image onto the canvas
        var canvas = document.querySelector("canvas"),
            context = canvas.getContext("2d")
        context.drawImage(image, 0, 0)
        // svg.remove()
        let imgData = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
        let index, colored_pixels = [];
        let background_color = d3.rgb(bgcolor)
        for (let i = 0; i < imgData.height; i++) {
            for (let j = 0; j < imgData.width; j++) {
                index = i * imgData.width + j;
                if (!(imgData.data[index * 4] === background_color.r && imgData.data[index * 4 + 1] === background_color.g && imgData.data[index * 4 + 2] === background_color.b)) {
                    let color
                    for (let k = 0; k < used_colors.length; k++) {
                        if (Math.abs(used_colors[k][0].r - imgData.data[index * 4]) < 2 && Math.abs(used_colors[k][0].g - imgData.data[index * 4 + 1]) < 2 && Math.abs(used_colors[k][0].b - imgData.data[index * 4 + 2]) < 2) {
                            color = used_colors[k]
                            break
                        }
                    }
                    if (color)
                        colored_pixels.push([j, i, color])
                    else {
                        imgData.data[index * 4] = background_color.r
                        imgData.data[index * 4 + 1] = background_color.g
                        imgData.data[index * 4 + 2] = background_color.b
                    }
                }
            }
        }
        console.log(colored_pixels);
        var brush = d3.brush()
            .on("start brush", brushed)
            .on("end", brushended);

        brush_svg.append("g")
            .attr("class", "brush")
            .call(brush)
            .call(brush.move, null);
        brush_svg.select(".selection").style("fill-opacity", 0).style("stroke", "#ccc").style("stroke-width", "4")

        function brushed() {
            var e = d3.event.selection
            if (!e) return;
            // console.log(e[0][0], e[0][1], e[1][0], e[1][1]);
            for (let i = 0; i < colored_pixels.length; i++) {
                index = colored_pixels[i][1] * imgData.width + colored_pixels[i][0];
                if (e[0][0] > colored_pixels[i][0] || colored_pixels[i][0] > e[1][0] || e[0][1] > colored_pixels[i][1] || colored_pixels[i][1] > e[1][1]) {
                    // not selected
                    imgData.data[index * 4] = colored_pixels[i][2][1].r
                    imgData.data[index * 4 + 1] = colored_pixels[i][2][1].g
                    imgData.data[index * 4 + 2] = colored_pixels[i][2][1].b
                } else {
                    // selected
                    imgData.data[index * 4] = colored_pixels[i][2][0].r
                    imgData.data[index * 4 + 1] = colored_pixels[i][2][0].g
                    imgData.data[index * 4 + 2] = colored_pixels[i][2][0].b
                }
            }

            putImageData(context, imgData)
        }

        function brushended() {
            if (!d3.event.selection) {
                for (let i = 0; i < colored_pixels.length; i++) {
                    index = colored_pixels[i][1] * imgData.width + colored_pixels[i][0];
                    imgData.data[index * 4] = colored_pixels[i][2][0].r
                    imgData.data[index * 4 + 1] = colored_pixels[i][2][0].g
                    imgData.data[index * 4 + 2] = colored_pixels[i][2][0].b
                }
                putImageData(context, imgData)
            }
        }

        function putImageData(ctx, imageData) {
            var height = imageData.height;
            var width = imageData.width;
            for (var y = 0; y < height; y++) {
                for (var x = 0; x < width; x++) {
                    var pos = y * width + x;
                    ctx.fillStyle = 'rgba(' + imageData.data[pos * 4 + 0] +
                        ',' + imageData.data[pos * 4 + 1] +
                        ',' + imageData.data[pos * 4 + 2] +
                        ',' + (imageData.data[pos * 4 + 3] / 255) + ')';
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        }
    }

    // set it as the source of the img element
    image.src = image64;
}

function appendPaletteResult(palette) {
    let palette_results_div = d3.select(".paletteDiv");
    let palette_size = palette.length / 2
    for (let i = 0; i < palette.length; i++) {
        if (i === palette_size) {
            palette_results_div.append("br")
        }
        // assemble a color
        let color = d3.rgb(palette[i]);
        let c = getColorNameIndex(color);
        // write the color name
        let t = c3.color.relatedTerms(c, 1);
        let span = palette_results_div.append("span").attr("class", "rect")
            .attr("id", function () {
                if (i < palette_size) {
                    return "highlighted_rect"
                } else {
                    return "dehighlighted_rect"
                }
            })
            .style("width", "30px").style("height", "30px").style("display", "inline-block")
            .style("margin-left", "10px").style("background", palette[i]).attr("color", palette[i])
            .style("text-align", "center").style("padding", "5px")
            .attr("title", function () {
                if (t[0] === undefined) return "no name";
                return c3.terms[t[0].index] + "-" + colorConversionFns['LCH'](d3.lab(palette[i]));
            });
        if (i >= palette_size) continue
        // append lock and unlock sign
        let img = span.append("img").attr("class", "icon_unlock").style("display", "none").attr("isLocked", "0")
            .on("click", function () {
                if (d3.select(this).attr("class") === "icon_lock")
                    d3.select(this).attr("class", "icon_unlock").attr("isLocked", "0").style("display", "none")
                else
                    d3.select(this).attr("class", "icon_lock").attr("isLocked", "1").style("display", "block")
            });
        if (locked_pos.indexOf(i) != -1) {
            img.attr("class", "icon_lock").style("display", "block").attr("isLocked", "1")
        }
        span.on("mouseover", function () {
            d3.select(this).select("img").style("display", "block");
        })
            .on("mouseout", function () {
                if (d3.select(this).select("img").attr("class") === "icon_unlock")
                    d3.select(this).select("img").style("display", "none")
            })
    }
    outputPalette(palette);
}

function outputPalette(palette) {
    //output the palette
    var format = resultsColorSpace,
        paletteStr = "[",
        data_palette_attr = "";
    for (let i = 0; i < palette.length - 1; i++) {
        paletteStr += "\"" + colorConversionFns[format](palette[i]) + "\",";
        data_palette_attr += palette[i] + ";";
    }
    paletteStr += "\"" + colorConversionFns[format](palette[palette.length - 1]) + "\"]";
    data_palette_attr += palette[palette.length - 1];
    d3.select("#paletteText").property('value', paletteStr).attr('data-palette', data_palette_attr);
}

$('.resultFnt').change(function () {
    resultsColorSpace = $(this).children("option:selected").text();
    var format = resultsColorSpace;
    var result = d3.select("#paletteText"),
        palette = result.attr('data-palette').split(';');

    palette = palette.map(function (c) {
        return d3.lab(c);
    });

    paletteStr = '[' + resultsQuote +
        palette.map(colorConversionFns[format])
            .join(resultsQuote + ', ' + resultsQuote) +
        resultsQuote + ']';
    result.property('value', paletteStr);
});

function changeBgcolor() {
    let bg_icon = d3.select("#bg_icon");
    if (bg_icon.attr("class") === "icon_black_bg") {
        bg_icon.attr("class", "icon_white_bg");
        // bgcolor = "#bbb";
        // bgcolor = d3.hsl(120, 1, 0.5);
        // bgcolor = "#000"
        // bgcolor = d3.rgb(128, 128, 128)
        bgcolor = d3.rgb(9, 38, 110)
        background_color_lab = d3.lab(d3.rgb(bgcolor))
        // bgcolor = "#4df141";
        // bgcolor = rgb2hcl(hcl2rgb(d3.hcl(270, 50, 50)));
        renderResult();
        d3.select(".paletteDiv").style("background", bgcolor)
    } else {
        bg_icon.attr("class", "icon_black_bg");
        bgcolor = "#fff";
        background_color_lab = d3.lab(d3.rgb(bgcolor))
        renderResult();
        d3.select(".paletteDiv").style("background", bgcolor)
    }
}

function saMode(mode) {
    if (mode === 0) {
        d3.select("#effi_icon").attr("class", "icon_efficiency_choosed");
        d3.select("#qual_icon").attr("class", "icon_quality");
        decline_rate = decline_rate_efficiency;
    } else {
        d3.select("#effi_icon").attr("class", "icon_efficiency");
        d3.select("#qual_icon").attr("class", "icon_quality_choosed");
        decline_rate = decline_rate_quality;
    }
}

function drawTransferFunction(palette) {

    let x_labels = Object.keys(labelToClass)

    // draw information table
    var dataForm = "";
    for (let i = 0; i < x_labels.length; i++) {
        let id = labelToClass[x_labels[i]]
        let c = getColorNameIndex(d3.rgb(palette[id])),
            t = c3.color.relatedTerms(c, 1);
        let color_name = "undefined"
        if (t[0] != undefined) {
            color_name = c3.terms[t[0].index]
        }
        // color_name = ""
        // for (let j = 0; j < 3; j++) {
        //     color_name += c3.terms[t[j].index] + "(" + (t[j].score).toFixed(2) + ")-"
        // }

        // c = getColorNameIndex(d3.rgb(palette[id + x_labels.length]))
        // t = c3.color.relatedTerms(c, 3);
        // let color_name2 = "undefined"
        // if (t[0] != undefined) {
        //     color_name2 = c3.terms[t[0].index]
        // }
        // color_name2 = ""
        // for (let j = 0; j < 3; j++) {
        //     color_name2 += c3.terms[t[j].index] + "(" + (t[j].score).toFixed(2) + ")-"
        // }
        dataForm += ("<tr><td><span class=\'icon_box-empty\' classId=\'" + labelToClass[x_labels[i]] + "\' id=\'icon_lock-" + labelToClass[x_labels[i]] + "\' style=\'display:inline-block;\' onclick=\'lockThisRect(this);\'></span>" +
            "</td><td>" +
            x_labels[i] +
            "</td><td>" +
            "<span class=\'tf_rect\' classId=\'" + labelToClass[x_labels[i]] + "\' style=\'background:" + palette[id] + ";\' onclick=\'lockThisRect(this);\'></span>" +
            // colorConversionFns['LCH'](palette[id]) +
            "</td><td>" +
            color_name + //"-" + getNameDifference(palette[id], palette[id + x_labels.length]).toFixed(2) + "-" +
            // "</td><td>" +
            // color_name2 +
            "</td><td>" +
            colorConversionFns['Hex'](palette[id]) + "-" +
            (d3.hsl(palette[id])).l.toFixed(2) + "-" +
            (d3.hsl(palette[id + x_labels.length])).l.toFixed(2) +
            // colorConversionFns['LCH2'](palette[id + x_labels.length]) +
            // ((d3.lab(d3.rgb(palette[id])))).L.toFixed(0) + "-" +
            // ((d3.lab(d3.rgb(palette[id + x_labels.length])))).L.toFixed(0) + "-" +
            // (d3.hsl(palette[id])).l.toFixed(2) + "-" +
            // (colorConversionFns['Lab'](d3.lab(d3.rgb(palette[id + x_labels.length]))))+
            // (colorConversionFns['HSL'](palette[id + x_labels.length])) +
            // (palette[id + x_labels.length].l).toFixed(2) +
            // getNameDifference(palette[id], palette[id + x_labels.length]).toFixed(2) +
            "</td></tr>");
    }
    document.getElementById("tfInfoLabel").innerHTML = dataForm;
}

function lockThisRect(item) {
    let palette = []
    let spans = d3.select(".paletteDiv").selectAll("span");
    spans.each(function () {
        palette.push(d3.rgb(d3.select(this).attr("color")))
    });
    let class_number = Object.keys(labelToClass).length
    let typeId = d3.select("#renderDiv").select("svg").attr("typeId")
    let choosed_id = +d3.select(item).attr("classId")
    if (d3.select("#icon_lock-" + choosed_id).attr("class") === "icon_box-empty") {
        d3.select("#icon_lock-" + choosed_id).attr("class", "icon_box-checked")
    }
    else {
        d3.select("#icon_lock-" + choosed_id).attr("class", "icon_box-empty")
    }
    for (let i = 0; i < class_number; i++) {
        if (d3.select("#tfInfoLabel").select("#icon_lock-" + i).attr("class") != "icon_box-checked")
            d3.select("#renderDiv").selectAll("#class_" + i)
                .attr("fill", function (d) {
                    if (typeId != "line")
                        return d3.select(this).attr("faint-color")
                    else
                        return "none"
                })
                .attr("stroke", function () {
                    if (typeId == "line")
                        return d3.select(this).attr("faint-color")
                    else
                        return "none"
                })
        else {
            d3.select("#renderDiv").selectAll("#class_" + i)
                .attr("fill", function (d) {
                    if (typeId != "line")
                        return d3.select(this).attr("item-color")
                    else
                        return "none"
                })
                .attr("stroke", function () {
                    if (typeId == "line")
                        return d3.select(this).attr("item-color")
                    else
                        return "none"
                })
                .raise(); // https://stackoverflow.com/questions/24045673/reorder-elements-of-svg-z-index-in-d3-js
        }

    }
}

/**
 * https://bl.ocks.org/Fil/6d9de24b31cb870fed2e6178a120b17d
 * @param {*} used_palette 
 */
function appendScatterplotMatrixCars(used_palette) {
    d3.select("#outputDiv").select("svg").remove()
    var size = 230,
        padding = 20;

    var x = d3.scaleLinear()
        .range([padding / 2, size - padding / 2]);

    var y = d3.scaleLinear()
        .range([size - padding / 2, padding / 2]);

    var xAxis = d3.axisBottom()
        .scale(x)
        .ticks(6);

    var yAxis = d3.axisLeft()
        .scale(y)
        .ticks(6);

    // var color = d3.scaleOrdinal(d3.schemeCategory10);
    let getLabel = function (d) {
        return d["LITH"]
    }

    d3.csv("./data/Xeek_Well_15-9-15.csv", function (error, data) {
        if (error) throw error;

        console.log("original:", data);
        data = data.filter(function (d) {
            return Math.random() < 0.15 && d['GR'] != '' && +d['GR'] <= 120 && d['NPHI'] != '' && d['DTC'] != '' && d['RHOB'] != ''
        })
        console.log("filtered:", data);
        var domainByTrait = {},
            traits = d3.keys(data[0]).filter(function (d) {
                return d == "RHOB" || d == "GR" || d == "NPHI" || d == "DTC";
            }),
            n = traits.length;

        traits.forEach(function (trait) {
            domainByTrait[trait] = d3.extent(data, function (d) { return +d[trait]; });
        });

        console.log("traits:", traits);

        xAxis.tickSize(size * n);
        yAxis.tickSize(-size * n);

        var brush = d3.brush()
            .on("start", brushstart)
            .on("brush", brushmove)
            .on("end", brushend)
            .extent([[0, 0], [size, size]]);

        var svg = d3.select("#outputDiv").append("svg")
            .attr("width", size * n + padding * 2)
            .attr("height", size * n + padding * 2)
            .append("g")
            .attr("transform", "translate(" + padding + "," + padding / 2 + ")");

        svg.selectAll(".x.axis")
            .data(traits)
            .enter().append("g")
            .attr("class", "x axis")
            .attr("transform", function (d, i) { return "translate(" + (n - i - 1) * size + ",0)"; })
            .each(function (d) { x.domain(domainByTrait[d]); d3.select(this).call(xAxis); });

        svg.selectAll(".y.axis")
            .data(traits)
            .enter().append("g")
            .attr("class", "y axis")
            .attr("transform", function (d, i) { return "translate(0," + i * size + ")"; })
            .each(function (d) { y.domain(domainByTrait[d]); d3.select(this).call(yAxis); });

        var cell = svg.selectAll(".cell")
            .data(cross(traits, traits))
            .enter().append("g")
            .attr("class", "cell")
            .attr("transform", function (d) { return "translate(" + (n - d.i - 1) * size + "," + d.j * size + ")"; })
            .each(plot);

        // Titles for the diagonal.
        cell.filter(function (d) { return d.i === d.j; }).append("text")
            .attr("x", padding)
            .attr("y", padding)
            .attr("dy", ".71em")
            .text(function (d) { return d.x; });

        cell.call(brush);

        cell.select(".selection").style("fill-opacity", 0).style("stroke", "#ccc").style("stroke-width", "4")

        function plot(p) {
            // console.log(p);
            var cell = d3.select(this);

            x.domain(domainByTrait[p.x]);
            y.domain(domainByTrait[p.y]);

            cell.append("rect")
                .attr("class", "frame")
                // .style("shape-rendering", "crispEdges")
                // .attr("fill", "none")
                // .style("stroke", "#aaa")
                .attr("x", padding / 2)
                .attr("y", padding / 2)
                .attr("width", size - padding)
                .attr("height", size - padding);

            cell.selectAll("circle")
                .data(orderData(data))
                .enter().append("circle")
                .attr("cx", function (d) { return x(d[p.x]); })
                .attr("cy", function (d) { return y(d[p.y]); })
                .attr("r", 4)
                .attr("fill", function (d) {
                    return used_palette[labelToClass[getLabel(d)]];
                })
                .attr("item-color", function (d) {
                    return used_palette[labelToClass[getLabel(d)]];
                })
                .attr("faint-color", function (d) {
                    return used_palette[labelToClass[getLabel(d)] + used_palette.length / 2];
                })
        }

        var brushCell;

        // Clear the previously-active brush, if any.
        function brushstart(p) {
            if (brushCell !== this) {
                d3.select(brushCell).call(brush.move, null);
                brushCell = this;
                x.domain(domainByTrait[p.x]);
                y.domain(domainByTrait[p.y]);
            }
        }
        // Highlight the selected circles.
        function brushmove(p) {
            var e = d3.brushSelection(this);

            svg.selectAll("circle").attr("fill", function (d) {
                return !e
                    ? d3.select(this).attr("item-color")
                    : ((
                        e[0][0] > x(+d[p.x]) || x(+d[p.x]) > e[1][0]
                        || e[0][1] > y(+d[p.y]) || y(+d[p.y]) > e[1][1]
                    ) ? d3.select(this).attr("faint-color") : d3.select(this).attr("item-color"));

                if (!e) {
                    return d3.select(this).attr("item-color")
                } else {
                    if (
                        e[0][0] > x(+d[p.x]) || x(+d[p.x]) > e[1][0]
                        || e[0][1] > y(+d[p.y]) || y(+d[p.y]) > e[1][1]
                    ) {
                        d3.select(this).lower()
                        return d3.select(this).attr("faint-color")
                    } else {
                        return d3.select(this).attr("item-color")
                    }
                }
            }).raise()
            svg.selectAll("rect").raise()
        }

        // If the brush is empty, select all circles.
        function brushend() {
            var e = d3.brushSelection(this);
            if (e === null) cell.selectAll("circle").attr("fill", function (d) {
                return d3.select(this).attr("item-color")
            });
        }

    });

    function cross(a, b) {
        var c = [], n = a.length, m = b.length, i, j;
        for (i = -1; ++i < n;) for (j = -1; ++j < m;) c.push({ x: a[i], i: i, y: b[j], j: j });
        return c;
    }

    function orderData(originData) {
        let tmp = []
        for (let d of originData) {
            if (!tmp[getLabel(d)]) tmp[getLabel(d)] = []
            tmp[getLabel(d)].push(d)
        }
        let arr = []
        for (let key in tmp) {
            arr.push([tmp[key].length, tmp[key]])
        }
        arr.sort(function (a, b) {
            return b[0] - a[0]
        })
        let result = []
        for (let a of arr) {
            result = result.concat(a[1])
        }
        return result
    }

}


function appendScatterplotMatrix(used_palette) {
    d3.select("#outputDiv").select("svg").remove()
    var size = 230,
        padding = 20;

    var x = d3.scaleLinear()
        .range([padding / 2, size - padding / 2]);

    var y = d3.scaleLinear()
        .range([size - padding / 2, padding / 2]);

    var xAxis = d3.axisBottom()
        .scale(x)
        .ticks(6);

    var yAxis = d3.axisLeft()
        .scale(y)
        .ticks(6);

    // var color = d3.scaleOrdinal(d3.schemeCategory10);
    let getLabel = function (d) {
        return d["LITH"]
    }

    d3.csv("./data/" + source_datasets_names[0], function (error, data) {
        if (error) throw error;

        // console.log("original:", data);
        data = data.filter(function (d) {
            return d['GR'] != '' && +d['GR'] <= 120 && d['NPHI'] != '' && d['DTC'] != '' && d['RHOB'] != ''
        })
        // console.log("filtered:", data);
        var domainByTrait = {},
            traits = d3.keys(data[0]).filter(function (d) {
                return d == "RHOB" || d == "GR" || d == "NPHI" || d == "DTC";
            }),
            n = traits.length;

        traits.forEach(function (trait) {
            domainByTrait[trait] = d3.extent(data, function (d) { return +d[trait]; });
        });
        // data = output_data_global
        // console.log("traits:", traits);

        xAxis.tickSize(size * n);
        yAxis.tickSize(-size * n);

        var brush = d3.brush()
            .on("start", brushstart)
            .on("brush", brushmove)
            .on("end", brushend)
            .extent([[0, 0], [size, size]]);

        var svg = d3.select("#outputDiv").append("svg")
            .attr("width", size * n + padding * 2)
            .attr("height", size * n + padding * 2)
            .append("g")
            .attr("transform", "translate(" + padding + "," + padding / 2 + ")");

        svg.selectAll(".x.axis")
            .data(traits)
            .enter().append("g")
            .attr("class", "x axis")
            .attr("transform", function (d, i) { return "translate(" + (n - i - 1) * size + ",0)"; })
            .each(function (d) { x.domain(domainByTrait[d]); d3.select(this).call(xAxis); });

        svg.selectAll(".y.axis")
            .data(traits)
            .enter().append("g")
            .attr("class", "y axis")
            .attr("transform", function (d, i) { return "translate(0," + i * size + ")"; })
            .each(function (d) { y.domain(domainByTrait[d]); d3.select(this).call(yAxis); });

        var cell = svg.selectAll(".cell")
            .data(cross(traits, traits))
            .enter().append("g")
            .attr("class", "cell")
            .attr("transform", function (d) { return "translate(" + (n - d.i - 1) * size + "," + d.j * size + ")"; })
            .each(plot);

        // Titles for the diagonal.
        cell.filter(function (d) { return d.i === d.j; }).append("text")
            .attr("x", padding)
            .attr("y", padding)
            .attr("dy", ".71em")
            .text(function (d) { return d.x; });

        cell.call(brush);

        cell.selectAll(".selection").style("fill-opacity", 0).style("stroke", "#ccc").style("stroke-width", "4")

        function plot(p) {
            // console.log(p);
            var cell = d3.select(this);

            x.domain(domainByTrait[p.x]);
            y.domain(domainByTrait[p.y]);

            cell.append("rect")
                .attr("class", "frame")
                // .style("shape-rendering", "crispEdges")
                // .attr("fill", "none")
                // .style("stroke", "#aaa")
                .attr("x", padding / 2)
                .attr("y", padding / 2)
                .attr("width", size - padding)
                .attr("height", size - padding);

            cell.selectAll("circle")
                .data(data)
                .enter().append("circle")
                .attr("cx", function (d) { return x(d[p.x]); })
                .attr("cy", function (d) { return y(d[p.y]); })
                .attr("r", 3)
                .attr("fill", function (d) {
                    return used_palette[labelToClass[getLabel(d)]];
                })
                .attr("item-color", function (d) {
                    return used_palette[labelToClass[getLabel(d)]];
                })
                .attr("faint-color", function (d) {
                    return used_palette[labelToClass[getLabel(d)] + used_palette.length / 2];
                })
        }

        var brushCell;

        // Clear the previously-active brush, if any.
        function brushstart(p) {
            if (brushCell !== this) {
                d3.select(brushCell).call(brush.move, null);
                brushCell = this;
                x.domain(domainByTrait[p.x]);
                y.domain(domainByTrait[p.y]);
            }
        }
        // Highlight the selected circles.
        function brushmove(p) {
            var e = d3.brushSelection(this);
            d3.select("#outputDiv").selectAll("circle").attr("fill", function (d) {

                if (!e) {
                    return d3.select(this).attr("item-color")
                } else {
                    if (
                        e[0][0] > x(+d[p.x]) || x(+d[p.x]) > e[1][0]
                        || e[0][1] > y(+d[p.y]) || y(+d[p.y]) > e[1][1]
                    ) {
                        // d3.select(this).lower()
                        return d3.select(this).attr("faint-color")
                    } else {
                        d3.select(this).raise()
                        return d3.select(this).attr("item-color")
                    }
                }
            })

            d3.select("#outputDiv").selectAll("rect").raise()
        }

        // If the brush is empty, select all circles.
        function brushend() {
            var e = d3.brushSelection(this);
            if (e === null) d3.select("#outputDiv").selectAll("circle").attr("fill", function (d) {
                return d3.select(this).attr("item-color")
            });
        }

    });

    function cross(a, b) {
        var c = [], n = a.length, m = b.length, i, j;
        for (i = -1; ++i < n;) for (j = -1; ++j < m;) c.push({ x: a[i], i: i, y: b[j], j: j });
        return c;
    }


}
