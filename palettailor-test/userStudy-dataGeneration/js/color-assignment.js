/**
 * calculate KNNG distance and non-separability weight
 * reference to "A Perception-Driven Approach to Supervised Dimensionality Reduction for Visualization"
 */
function getVariablesForComputeScore(data, knng_neighbors_num = 2) {
    //auxiliary variables
    var clusters = SplitDataByClass(data, labelToClass);
    var [labels, knng, dataset] = getKNNG(clusters, knng_neighbors_num);

    //variables in evaluation function
    var cb_weight = getSaliencyWeightOfClass(labels, knng),
        distanceWeight = getDistanceWeightOf2Classes(labels, knng, dataset);

    return [distanceWeight, cb_weight];
}

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
    let saliency_scale = d3.extent(saliencyWeight);
    for (let i = 0; i < saliencyWeight.length; i++) {
        saliencyWeight[i] = (saliencyWeight[i] - saliency_scale[0]) / (saliency_scale[1] - saliency_scale[0] + 0.000000001);
    }
    // console.log("saliencyWeight normalize:", saliencyWeight);
    return saliencyWeight;
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

let lambda = .4
// Evaluation function
function E(sigma, distanceOf2Clusters, saliencyWeight, distanceOf2Colors) {
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
    return score;
}