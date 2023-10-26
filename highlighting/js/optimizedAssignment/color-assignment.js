function generateOptimizedAssignment(data, palette, cluster_num) {
    let [knng_metric, ns_weight] = processData(data)
    let best_palette = doColorAssignmentBest(palette, cluster_num, knng_metric, ns_weight);
    return best_palette;
}

function processData(data) {
    //scatter plot
    let [knng_metric, ns_weight] = getVariablesForComputeScore(data);
    console.log("knng scatterplot distance:", knng_metric);
    console.log("knng scatterplot contrast:", ns_weight);
    return [knng_metric, ns_weight];
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

function doColorAssignmentBest(palette, class_num, knng_metric, ns_weight) {
    // let class_num = palette.length;
    let distanceOf2Colors = calculateDistOf2Colors(palette);
    //best
    let ga = new GA(new Random(Date.now()),
        palette.length,
        (a, b) => a - b,
        (sigma) => _Eval(sigma, knng_metric, ns_weight, distanceOf2Colors),
        (x) => x, 3000);
    let sigmaAndScore = ga.compute();
    let best_palette = new Array(class_num);
    for (let i = 0; i < class_num; i++) {
        best_palette[i] = palette[sigmaAndScore.sigma[i]];
    }

    return best_palette;
}

function doColorAssignmentWorst(palette, class_num, knng_metric, ns_weight) {
    // let class_num = palette.length;
    let distanceOf2Colors = calculateDistOf2Colors(palette);
    //best
    let ga = new GA(new Random(Date.now()),
        palette.length,
        (a, b) => b - a,
        (sigma) => E(sigma, knng_metric, ns_weight, distanceOf2Colors),
        (x) => -x, 3000);
    let sigmaAndScore = ga.compute();

    let best_palette = new Array(class_num);
    for (let i = 0; i < class_num; i++) {
        best_palette[i] = palette[sigmaAndScore.sigma[i]];
    }

    return best_palette;
}
/**
 * calculate KNNG distance
 */
function _SplitDataByClass(data) {
    var clusters = {};
    for (let d of data) {
        let id = labelToClass[d.label]
        if (clusters[id] == undefined)
            clusters[id] = [];
        clusters[id].push({
            x: xMap(d),
            y: yMap(d),
            label: d.label
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


/**
 * calculate KNNG distance and non-separability weight
 * reference to "A Perception-Driven Approach to Supervised Dimensionality Reduction for Visualization"
 */
function getVariablesForComputeScore(data, knng_neighbors_num = 2) {
    //auxiliary variables
    var clusters = _SplitDataByClass(data);
    var [labels, knng] = getKNNG(clusters, knng_neighbors_num);
    //variables in evaluation function
    var cb_weight = getSaliencyWeightOfClass(labels, knng),
        distanceWeight = _getDistanceWeightOf2Classes(labels, knng);

    return [distanceWeight, cb_weight];
}

function getSaliencyWeightOfClass(labels, knng) {
    var saliencyWeight = [];
    for (var i = 0; i < labels.length; i++) {
        if (saliencyWeight[labels[i]] === undefined)
            saliencyWeight[labels[i]] = 0;
        var stat = [0, 0];
        for (var j in knng[i]) {
            if (knng[i][j] === 0) // if distance between point i and j is 0
                continue;
            if (labels[i] != labels[j])
                stat[0] += inverseFunc(Math.sqrt(knng[i][j]));
            else
                stat[1] += inverseFunc(Math.sqrt(knng[i][j]));
        }
        saliencyWeight[labels[i]] += (stat[0] - stat[1]);
    }
    //normalize saliency
    // let saliency_scale = d3.extent(saliencyWeight);
    // for (let i = 0; i < saliencyWeight.length; i++) {
    //     saliencyWeight[i] = (saliencyWeight[i] - saliency_scale[0]) / (saliency_scale[1] - saliency_scale[0] + 0.000000001);
    // }
    // console.log("saliencyWeight normalize:", saliencyWeight);
    return saliencyWeight;
}

function _getDistanceWeightOf2Classes(labels, knng) {
    var distanceDict = {};
    for (var i = 0; i < knng.length; i++) {
        for (var j in knng[i]) {
            if (labels[i] != labels[j]) {
                if (distanceDict[labels[i]] === undefined)
                    distanceDict[labels[i]] = {};
                if (distanceDict[labels[i]][labels[j]] === undefined)
                    distanceDict[labels[i]][labels[j]] = [];
                distanceDict[labels[i]][labels[j]].push(inverseFunc(Math.sqrt(knng[i][j])));
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

// Evaluation function
function _Eval(sigma, distanceOf2Clusters, saliencyWeight, distanceOf2Colors) {
    let lambda = .4
    function E_cd(sigma, distanceOf2Clusters, distanceOf2Colors) {
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
    var score_cd = E_cd(sigma, distanceOf2Clusters, distanceOf2Colors),
        score_lc = E_lc();
    var score = score_cd + score_lc;
    // console.log(score_cd, score_lc);
    return score;
}