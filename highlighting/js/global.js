//global variables:
let svg_margin = {
    top: 20,
    right: 20,
    bottom: 80,
    left: 40
},
    radius = 6,
    svg_width = 500,
    svg_height = 500,
    SVGWIDTH = svg_width + svg_margin.left + svg_margin.right,
    SVGHEIGHT = svg_height + svg_margin.top + svg_margin.bottom;


let score_importance_weight = new Array(4);
score_importance_weight[0] = document.getElementById("inputBox_lc").value / 100;
score_importance_weight[1] = document.getElementById("inputBox_bc").value / 100;
score_importance_weight[2] = document.getElementById("inputBox_nd").value / 100;
score_importance_weight[3] = document.getElementById("inputBox_nc").value / 100;

let source_datasets, source_datasets_names, labelToClass, scaled_datasets;
let alphaShape_distance, cluster_nums, non_separability_weights;
let xScale, xMap, xAxis, yScale, yMap, yAxis;
let locked_pos, data_changed_sign = false;
let bgcolor = "#fff", background_color_lab = d3.lab(d3.rgb(bgcolor))
let DATATYPE = "SCATTERPLOT";
let Tableau_20_palette = ["#4E79A7", "#A0CBE8", "#F28E2B", "#FFBE7D", "#59A14F", "#8CD17D", "#B6992D", "#F1CE63", "#499894", "#86BCB6", "#E15759", "#FF9D9A", "#79706E", "#BAB0AC", "#D37295", "#FABFD2", "#B07AA1", "#D4A6C8", "#9D7660", "#D7B5A6"];
let Tableau_10_palette = ["#4E79A7", "#F28E2B", "#E15759", "#76B7B2", "#59A14F", "#EDC948", "#B07AA1", "#FF9DA7", "#9C755F", "#BAB0AC"];
let color_names_checked, color_blind_type;
let best_color_names = {
    "brown": d3.rgb(100, 53, 0),
    "orange": d3.rgb(255, 118, 2),
    "yellow": d3.rgb(255, 246, 3),
    "red": d3.rgb(255, 30, 32),
    "pink": d3.rgb(255, 147, 205),
    "blue": d3.rgb(5, 74, 255),
    "green": d3.rgb(14, 160, 46),
    "grey": d3.rgb(143, 136, 135),
    "purple": d3.rgb(113, 0, 135),
    "black": d3.rgb(4, 11, 5),
    "white": d3.rgb(255, 255, 255)
};
let decline_rate_efficiency = 0.99,
    decline_rate_quality = 0.999,
    decline_rate = 0.99;

// color name lookup table
let color_name_map = {};
// color saliency range
let minE = -4.5,
    maxE = 0;
