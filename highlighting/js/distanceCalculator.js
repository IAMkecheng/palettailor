/**
 * calculating the Color Saliency 
 * reference to "Color Naming Models for Color Selection, Image Editing and Palette Design"
 */
function getColorNameIndex(c) {
    var x = d3.lab(c),
        L = 5 * Math.round(x.L / 5),
        a = 5 * Math.round(x.a / 5),
        b = 5 * Math.round(x.b / 5),
        s = [L, a, b].join(",");
    return color_name_map[s];
}

function getColorSaliency(x) {
    let c = getColorNameIndex(x);
    return (c3.color.entropy(c) - minE) / (maxE - minE);
}

function getNameDifference(x1, x2) {
    let c1 = getColorNameIndex(x1),
        c2 = getColorNameIndex(x2);
    return 1 - c3.color.cosine(c1, c2);
}

function getColorName(color) {
    let c = getColorNameIndex(color),
        t = c3.color.relatedTerms(c, 1);
    if (t[0] != undefined) {
        return c3.terms[t[0].index]
    }
    return undefined
}

function getColorName2(color) {
    let c = getColorNameIndex(color),
        t = c3.color.relatedTerms(c, 10);
    let names = []
    for (let i = 0; i < t.length; i++) {
        if (t[i] != undefined) {
            names.push(c3.terms[t[i].index])
        }
    }
    return names
}
/**
 * calculate KNNG distance
 */
function SplitDataByClass(data, label2class) {
    var clusters = {};
    for (let d of data) {
        if (clusters[label2class[d.label]] == undefined)
            clusters[label2class[d.label]] = [];
        clusters[label2class[d.label]].push({
            x: d.x,
            y: d.y,
            label: d.label
        });
    }
    return clusters;
}

/**
 * 1. calculate the separability
 * 2. calculate the non-separability
 * @param {*} datasets 
 * @param {*} extent 
 */
function calculateAlphaShapeDistance(datasets, extent) {
    let cluster_num = Object.keys(labelToClass).length;
    alphaShape_distance = new Array(cluster_num);
    for (let i = 0; i < cluster_num; i++) {
        alphaShape_distance[i] = new Array(cluster_num).fill(0);
    }
    let non_separability_weights_tmp = new Array(cluster_num).fill(0);
    non_separability_weights = new Array(cluster_num).fill(0);
    let alpha_extent = [10000000, -10000000], beta_extent = [10000000, -10000000]
    for (let m = 0; m < datasets.length; m++) {
        let voronoi = d3.voronoi().x(function (d) { return d.x; }).y(function (d) { return d.y; })
            .extent(extent);
        let diagram = voronoi(datasets[m]);
        let cells = diagram.cells;
        let alpha = 25 * 2;
        let distanceDict = {};
        for (let cell of cells) {
            if (cell === undefined) continue;
            let label = labelToClass[cell.site.data.label];
            // console.log(cell.halfedges);
            let stat = [0, 0];
            cell.halfedges.forEach(function (e) {
                let edge = diagram.edges[e];
                let ea = edge.left;
                if (ea === cell.site || !ea) {
                    ea = edge.right;
                }
                if (ea) {
                    let ea_label = labelToClass[ea.data.label];
                    let dx, dy, dist;
                    dx = cell.site[0] - ea[0];
                    dy = cell.site[1] - ea[1];
                    dist = Math.sqrt(dx * dx + dy * dy);
                    dist = inverseFunc(dist) / cell.halfedges.length
                    if (alpha > dist) {
                        if (label != ea_label) {
                            if (distanceDict[label] === undefined)
                                distanceDict[label] = {};
                            if (distanceDict[label][ea_label] === undefined)
                                distanceDict[label][ea_label] = [];
                            distanceDict[label][ea_label].push(dist);
                            stat[0] += dist;
                        } else {
                            stat[1] += dist;
                        }
                    }
                }
            });
            non_separability_weights_tmp[label] += (stat[0] - stat[1]);
        }
        // console.log("distanceDict:", distanceDict);

        for (var i in distanceDict) {
            for (var j in distanceDict[i]) {
                i = +i, j = +j;
                alphaShape_distance[i][j] += d3.sum(distanceDict[i][j]) / Math.pow(cluster_nums[m][i], 1);
                alpha_extent[0] = alpha_extent[0] > alphaShape_distance[i][j] ? alphaShape_distance[i][j] : alpha_extent[0]
                alpha_extent[1] = alpha_extent[1] < alphaShape_distance[i][j] ? alphaShape_distance[i][j] : alpha_extent[1]
            }
        }
        for (let i = 0; i < cluster_num; i++) {
            non_separability_weights[i] += non_separability_weights_tmp[i] / Math.pow(cluster_nums[m][i], 1);
        }
    }

    for (let i = 0; i < cluster_num; i++) {
        // non_separability_weights[i] = Math.exp(non_separability_weights[i]);
        beta_extent[0] = beta_extent[0] > non_separability_weights[i] ? non_separability_weights[i] : beta_extent[0]
        beta_extent[1] = beta_extent[1] < non_separability_weights[i] ? non_separability_weights[i] : beta_extent[1]
    }

    // normalize the distance
    for (let i = 0; i < cluster_num; i++) {
        non_separability_weights[i] = 0.5 * (non_separability_weights[i] - beta_extent[0]) / (beta_extent[1] - beta_extent[0] + 0.00001) + 1
        // non_separability_weights[i] = Math.exp(non_separability_weights[i])
        for (let j = 0; j < cluster_num; j++) {
            alphaShape_distance[i][j] = 0.5 * (alphaShape_distance[i][j] - alpha_extent[0]) / (alpha_extent[1] - alpha_extent[0] + 0.00001) + 1
            // alphaShape_distance[i][j] = Math.exp(alphaShape_distance[i][j])
        }
    }


    console.log("alphaShape_distance:", alphaShape_distance);
    console.log("non_separability_weights:", non_separability_weights);

}