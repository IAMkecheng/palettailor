
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

/**
 * alpha-Shape graph Implementation
 * using Philippe Rivière’s bl.ocks.org/1b7ddbcd71454d685d1259781968aefc 
 * voronoi.find(x,y) finds the nearest cell to the point (x,y).
 * extent is like: [[30, 30], [width - 30, height - 30]]
 */
function calculateAlphaShape(data, extent) {
    let voronoi = d3.voronoi().x(function (d) { return xMap(d); }).y(function (d) { return yMap(d); })
        .extent(extent);
    let diagram = voronoi(data);
    let cells = diagram.cells;
    let alpha = 25 * 25 * 2;
    let distanceDict = {};
    for (let cell of cells) {
        if(cell === undefined) continue;
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
                        if (distanceDict[label] === undefined)
                            distanceDict[label] = {};
                        if (distanceDict[label][ea_label] === undefined)
                            distanceDict[label][ea_label] = [];
                        distanceDict[label][ea_label].push(inverseFunc(Math.sqrt(dist)));
                    }
                }
            }
        });
    }
    // console.log("distanceDict:", distanceDict);


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
    // console.log("distanceOf2Clusters:", distanceOf2Clusters);


    return distanceOf2Clusters;
}

