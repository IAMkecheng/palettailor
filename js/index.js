
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
      document.getElementById("slider_0_label").innerText = label_value.toFixed(2);
      score_importance_weight[0] = label_value;
      break;
    case "slider_1":
      document.getElementById("slider_1_label").innerText = label_value.toFixed(2);
      score_importance_weight[1] = label_value;
      break;
    case "slider_2":
      document.getElementById("slider_2_label").innerText = label_value.toFixed(2);
      score_importance_weight[2] = label_value;
      break;
    case "slider_radius":
      document.getElementById("slider_rr_label").innerText = value;
      radius = value;
      d3.selectAll(".dot").attr("r", value);
      d3.selectAll(".linechart").style("stroke-width", radius);
      break;
    default:

  }
}

c3.load("js/lib/c3_data.json");
for (var c = 0; c < c3.color.length; ++c) {
  var x = c3.color[c];
  color_name_map[[x.L, x.a, x.b].join(",")] = c;
}

function addToHistory() {
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
        d3.select(this).remove();
        var result = d3.select(this),
          palette = result.attr('data-palette').split(';');
        palette = palette.map(function (c) {
          return d3.lab(c);
        });
        outputPalette(palette);
      });
    let div = li.append("div").attr("class", "screenshot");
    svgs.each(function () {
      d3.select(this).attr("width", 80).attr("height", 80)
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "0 0 " + SVGWIDTH + " " + SVGHEIGHT);
      // li.node().appendChild(d3.select(this).node());
      div.node().appendChild(d3.select(this).node());
    });
    let rects = d3.select(".paletteDiv").selectAll(".rect");
    div = li.append("div").attr("class", "paletteBar");
    if (rects._groups[0].length > 0) {
      rects.each(function () {
        // li.node().appendChild(d3.select(this).node());
        div.node().appendChild(d3.select(this).node());
      });
    }
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
    let palette;
    //scatterplot
    if (DATATYPE === "SCATTERPLOT") {
      palette = appendScatterplot();
    }

    //bar chart
    if (DATATYPE === "BARCHART") {
      palette = appendBarchart();
    }

    //line chart
    if (DATATYPE === "LINECHART") {
      palette = appendLinechart();
    }

    // draw the palette
    appendPaletteResult(palette);
    data_changed_sign = false;

    document.querySelector('#running').classList.add('hide')
  }, 0);
}

function appendScatterplot() {
  let used_palette = doColorization();

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
    .attr("fill", function (d, i) {
      return used_palette[labelToClass[cValue(d)]];
    });
  return used_palette;
}

function appendBarchart() {
  let used_palette = doColorization();

  let data = [];
  for (let i of source_data) {
    data.push(i.y);
  }

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
  axis_x.domain(data.map(function (d, i) {
    return i;
  }));
  axis_y.domain([0, d3.max(data, function (d) {
    return d;
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
    .attr("id", function (d, i) {
      return "bar_" + i;
    })
    .style("fill", function (d, i) {
      return used_palette[i];
    })
    .attr("x", function (d, i) {
      return axis_x(i);
    })
    .attr("width", axis_x.bandwidth())
    .attr("y", function (d) {
      return axis_y(d);
    })
    .attr("height", function (d) {
      return svg_height - axis_y(d);
    })
    .attr("rx", 10).attr("ry", 10);

  // // Appends a circle for each datapoint 
  // barchart.selectAll(".dot")
  //   .data(source_data)
  //   .enter().append("circle") // Uses the enter().append() method
  //   .attr("class", "dot") // Assign a class for styling
  //   .attr("cx", function (d, i) {
  //     return axis_x(i) + axis_x.bandwidth() / 2;
  //   })
  //   .attr("cy", function (d) {
  //     return svg_height / 2 + axis_y(d.y) / 2;
  //   })
  //   .attr("r", radius)
  //   .style("stroke", "#fff")
  //   .style("fill", function (d) { return used_palette[labelToClass[d.label]] });
  return used_palette;
}

function appendLinechart() {
  let used_palette = doColorization();

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
      return axis_x(d.x);
    })
    .y(function (d) {
      return axis_y(d.y);
    }).curve(d3.curveCatmullRom);

  let linechart_source_data = [];
  for (let point of source_data) {
    if (linechart_source_data[labelToClass[point.label]] == undefined) {
      linechart_source_data[labelToClass[point.label]] = { p: [], label: point.label };
    }
    linechart_source_data[labelToClass[point.label]].p.push({ x: point.x, y: point.y });
  }
  // Scale the range of the data
  axis_x.domain([d3.min(linechart_source_data, function (d) {
    return d3.min(d.p, function (e) {
      return e.x;
    });
  }), d3.max(linechart_source_data, function (d) {
    return d3.max(d.p, function (e) {
      return e.x;
    });
  })]);
  axis_y.domain([d3.min(linechart_source_data, function (d) {
    return d3.min(d.p, function (e) {
      return e.y;
    });
  }), d3.max(linechart_source_data, function (d) {
    return d3.max(d.p, function (e) {
      return e.y;
    });
  })]);

  // Add the valueline path.
  linechart.selectAll('path')
    .data(linechart_source_data).enter().append("path")
    .attr("d", function (d) {
      return valueline(d.p);
    })
    .attr("class", "linechart")
    .attr("id", function (d) {
      return "line_" + labelToClass[d.label];
    })
    .attr("fill", "none")
    .attr("stroke", function (d) {
      return used_palette[labelToClass[d.label]];
    })
    .style("stroke-width", radius);

  // Add the X Axis
  linechart.append("g")
    .attr("transform", "translate(0," + svg_height + ")")
    .call(d3.axisBottom(axis_x).tickFormat(""));

  // Add the Y Axis
  linechart.append("g")
    .call(d3.axisLeft(axis_y).tickFormat(""));

  // Appends a circle for each datapoint 
  linechart.selectAll(".dot")
    .data(source_data)
    .enter().append("circle") // Uses the enter().append() method
    .attr("class", "dot") // Assign a class for styling
    .attr("cx", function (d) {
      return axis_x(d.x)
    })
    .attr("cy", function (d) { return axis_y(d.y) })
    .attr("r", radius)
    .style("stroke", "#fff")
    .style("fill", function (d) { return used_palette[labelToClass[d.label]] });

  return used_palette;
}

function appendPaletteResult(palette) {
  let palette_results_div = d3.select(".paletteDiv");
  for (let i = 0; i < palette.length; i++) {
    // assemble a color
    let color = d3.rgb(palette[i]);
    let c = getColorNameIndex(color);
    // write the color name
    let t = c3.color.relatedTerms(c, 1);
    let span = palette_results_div.append("span").attr("class", "rect")
      .style("width", "30px").style("height", "30px").style("display", "inline-block")
      .style("margin-left", "10px").style("background", palette[i]).attr("color", palette[i])
      .style("text-align", "center").style("padding", "5px")
      .attr("title", function () {
        if (t[0] === undefined) return "no name";
        return c3.terms[t[0].index];
      });
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
    bgcolor = "#000";
    renderResult();
  } else {
    bg_icon.attr("class", "icon_black_bg");
    bgcolor = "#fff";
    renderResult();
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