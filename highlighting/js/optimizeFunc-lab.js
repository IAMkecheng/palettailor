/**
 * different luminance
 */

function doColorization() {
    let class_number = Object.keys(labelToClass).length;
    //get the luminance range
    let luminanceRange = [+d3.select("#lightnessFilterRangeLow").property('value'), +d3.select("#lightnessFilterRangeHigh").property('value')];
    let colors_scope = { "hue_scope": [0, 360], "chroma_scope": [40, 100], "lumi_scope": luminanceRange };

    // check if exist locked color
    let origin_palette = [], blank_pos = [], id = 0;
    locked_pos = []
    let spans = d3.select(".paletteDiv").selectAll("span#highlighted_rect");
    if (!data_changed_sign)
        spans.each(function () {
            if (+d3.select(this).select("img").attr("isLocked") === 1) {
                origin_palette.push(d3.rgb(d3.select(this).attr("color")))
                locked_pos.push(id)
            } else {
                origin_palette.push("")
            }
            id++;
        });

    for (let i = 0; i < class_number; i++) {
        if (locked_pos.indexOf(i) === -1) {
            blank_pos.push(id)
        }
    }
    let best_color;

    let start = new Date().getTime();
    if (locked_pos.length === 0) {
        best_color = simulatedAnnealing2FindBestPalette(class_number, colors_scope);
        while (best_color.score === -10000000) {
            best_color = simulatedAnnealing2FindBestPalette(class_number, colors_scope);
            getPaletteScore(best_color.id, true)
            console.log("re-do", best_color.luminance, best_color.score);
        }
    }
    else {
        console.log("----------------------");
        best_color = completePalette(origin_palette, blank_pos, colors_scope);
    }
    let end = new Date().getTime();
    let time_consumed = (end - start);
    console.log("Consuming " + time_consumed + " ms");

    console.log("=======================================================");
    let bg = rgb2hcl(d3.rgb(bgcolor))
    console.log("background = ", bg);
    console.log("final chroma = ", best_color.chroma);
    console.log("final luminance = ", best_color.luminance);
    console.log("final score = ", best_color.score);
    getPaletteScore(best_color.id, true)
    // if already have a svg, then insert it to the history
    addToHistory();
    let used_palette = best_color.id.slice()


    let used_palette_0 = used_palette.slice()
    for (let i = 0; i < class_number; i++) {
        console.log(used_palette_0[i + class_number]);
        used_palette_0[i + class_number] = "#ccc"
    }
    console.log("=======================================================");
    appendScatterplot(used_palette_0)
    appendPaletteResult(used_palette_0);
    d3.select(".paletteDiv").append("br")

    used_palette_0 = used_palette.slice()
    for (let i = 0; i < class_number; i++) {
        used_palette_0[i + class_number] = d3.hcl(used_palette_0[i].h, bg.c, bg.l)
    }
    console.log("=======================================================");
    appendScatterplot(used_palette_0)
    appendPaletteResult(used_palette_0);
    d3.select(".paletteDiv").append("br")

    let background_color = d3.rgb(bgcolor)
    // console.log("bg", rgb2hcl(background_color));
    used_palette_0 = best_color.id.slice()//[d3.hsl(240, 1, 0.5), "#00b900", "#ca9400", "#fe5292", "#42a1fe", "#fd2507", "#2f8283", "#727b47"]//["#00b800", "#fe00a4", "#fe131f", "#00aae7", "#b29e00", "#a268f5", "#768575", "#b08f83"]//
    for (let i = 0; i < class_number; i++) {
        let color = d3.rgb(used_palette_0[i])
        let color1 = traditionalColorBlending([color.r, color.g, color.b, 0.25], [background_color.r, background_color.g, background_color.b, 1])
        used_palette_0[i + class_number] = d3.rgb(color1[0], color1[1], color1[2])
        console.log(rgb2hcl(used_palette_0[i + class_number]));
    }
    console.log("=======================================================");
    console.log("opacity 0.25:");
    getPaletteScore(used_palette_0, true)
    appendScatterplot(used_palette_0)
    appendPaletteResult(used_palette_0)
    d3.select(".paletteDiv").append("br")

    drawTransferFunction(used_palette);

    return used_palette;
}
function traditionalColorBlending(a, b) {
    var mix = [];
    mix[3] = 1 - (1 - a[3]) * (1 - b[3]); // alpha
    mix[0] = (a[0] * a[3] / mix[3]) + (b[0] * b[3] * (1 - a[3]) / mix[3]); // red
    mix[1] = (a[1] * a[3] / mix[3]) + (b[1] * b[3] * (1 - a[3]) / mix[3]); // green
    mix[2] = (a[2] * a[3] / mix[3]) + (b[2] * b[3] * (1 - a[3]) / mix[3]); // blue
    return mix;
}
function getPaletteScore(p, sign = false) {
    let class_number = p.length / 2
    let palette = p.slice(0, class_number);
    let palette2 = p.slice(class_number, p.length);

    let color_dis = new Array(class_number)
    for (let i = 0; i < class_number; i++) color_dis[i] = new Array(class_number)
    let bg_contrast_array = new Array(class_number)
    let name_difference = 0, name_consistency = 0, min_cd = 100000, min_nd = 100000

    for (let i = 0; i < class_number; i++) {
        // background contrast
        let bg_0 = d3_ciede2000(d3.lab(palette[i]), d3.lab(d3.rgb(bgcolor))),
            bg_1 = d3_ciede2000(d3.lab(palette2[i]), d3.lab(d3.rgb(bgcolor)))
        bg_contrast_array[i] = bg_0 - bg_1
        // if (bg_1 < 5 || bg_contrast_array[i] < 10) {
        //     if (sign) console.log(i, bg_contrast_array[i], bg_0, bg_1, d3.rgb(bgcolor), d3.lab(d3.rgb(bgcolor)));
        //     return -10000000
        // }

        for (let j = i + 1; j < class_number; j++) {
            // local contrast
            let cd_0 = d3_ciede2000(d3.lab(palette[i]), d3.lab(palette[j])),
                cd_1 = d3_ciede2000(d3.lab(palette2[i]), d3.lab(palette2[j]))
            // if (cd_0 < 10 || cd_1 < 5) return -10000000
            color_dis[i][j] = color_dis[j][i] = (cd_0 + cd_1)

            min_cd = min_cd > cd_0 ? cd_0 : min_cd
            min_nd = min_nd > cd_1 ? cd_1 : min_nd

            // name difference
            let nd_0 = getNameDifference(d3.lab(palette[i]), d3.lab(palette[j])),
                nd_1 = getNameDifference(d3.lab(palette2[i]), d3.lab(palette2[j]))
            name_difference += nd_0 + nd_1;

            // min_nd = min_nd > nd_0 ? nd_0 : min_nd
            // min_nd = min_nd > nd_1 ? nd_1 : min_nd
        }
        // name consistency
        let nc = getNameDifference(palette[i], palette2[i]);
        if (isNaN(nc) || nc > 0.9) {
            // console.log(palette[i], palette2[i], d3.lab(palette[i]), d3.lab(palette2[i]), getColorNameIndex(palette[i]), getColorNameIndex(palette2[i]));
            // return -1000000
            nc = 10
        }
        name_consistency += nc
    }

    let tmp_pd = new Array(class_number).fill(0),
        tmp_cb = new Array(class_number).fill(0);
    for (let i = 0; i < class_number; i++) {
        for (let j = 0; j < class_number; j++) {
            if (i === j) continue;
            tmp_pd[i] += alphaShape_distance[i][j] * (color_dis[i][j]);
        }
        tmp_pd[i] /= (class_number - 1)
        tmp_cb[i] += non_separability_weights[i] * (bg_contrast_array[i])
    }

    let local_contrast = getBaseLog(100, 1 + d3.mean(tmp_pd))
    let background_contrast = getBaseLog(100, 1 + d3.mean(tmp_cb))
    name_difference /= class_number * (class_number - 1);
    name_consistency /= class_number

    // if (DATATYPE === "LINECHART") {
    //     background_contrast *= 10
    // } else {
    //     background_contrast *= 4
    // }

    let palette_score = score_importance_weight[0] * local_contrast + score_importance_weight[1] * background_contrast + score_importance_weight[2] * name_difference * 2 - score_importance_weight[3] * name_consistency + min_cd * 0.1 + min_nd * 0.1

    if (isNaN(palette_score) || !palette_score) return -10000000
    if (sign)
        console.log(local_contrast.toFixed(2), background_contrast.toFixed(2), name_difference.toFixed(2), name_consistency.toFixed(2), palette_score.toFixed(2), min_cd.toFixed(2), min_nd.toFixed(2));
    return palette_score
}


function getPaletteScore2(p, sign = false) {
    let class_number = p.length / 2
    let palette = p.slice(0, class_number);
    let palette2 = p.slice(class_number, p.length);

    let color_dis = new Array(class_number)
    for (let i = 0; i < class_number; i++) {
        color_dis[i] = new Array(class_number)
    }
    let bg_contrast_array = new Array(class_number)
    let name_difference = 0, name_consistency = 0, min_cd = 100000, min_nd = 100000

    for (let i = 0; i < class_number; i++) {
        // background contrast
        let bg_0 = d3_ciede2000(d3.lab(palette[i]), d3.lab(d3.rgb(bgcolor))),
            bg_1 = d3_ciede2000(d3.lab(palette2[i]), d3.lab(d3.rgb(bgcolor)))
        bg_contrast_array[i] = bg_0 - bg_1
        // if (bg_1 < 5 || bg_contrast_array[i] < 10) {
        //     if (sign) console.log(i, bg_contrast_array[i], bg_0, bg_1, d3.rgb(bgcolor), d3.lab(d3.rgb(bgcolor)));
        //     return -10000000
        // }
        // if (bg_1 > bg_0 - 10) {
        //     return -10000000
        // }

        for (let j = i + 1; j < class_number; j++) {
            // local contrast
            let cd_0 = d3_ciede2000(d3.lab(palette[i]), d3.lab(palette[j])),
                cd_1 = d3_ciede2000(d3.lab(palette2[i]), d3.lab(palette2[j]))
            if (cd_0 < 10 || cd_1 < 5) return -10000000
            color_dis[i][j] = color_dis[j][i] = (cd_0 + cd_1)

            min_cd = min_cd > cd_0 ? cd_0 : min_cd
            min_nd = min_nd > cd_1 ? cd_1 : min_nd

            // name difference
            let nd_0 = getNameDifference(d3.lab(palette[i]), d3.lab(palette[j])),
                nd_1 = getNameDifference(d3.lab(palette2[i]), d3.lab(palette2[j]))
            name_difference += nd_0 + nd_1;

            // min_nd = min_nd > nd_0 ? nd_0 : min_nd
            // min_nd = min_nd > nd_1 ? nd_1 : min_nd
        }

        // name consistency
        let nd_own = getNameDifference(palette[i], palette2[i]), nc = 0;
        for (let j = 0; j < class_number; j++) {
            if (i === j || isNaN(nd_own)) continue
            if (nd_own < getNameDifference(d3.lab(palette2[i]), d3.lab(palette[j]))) {
                nc += 1
            }
        }
        name_consistency += nc / (class_number - 1)
    }

    let tmp_pd = new Array(class_number).fill(0),
        tmp_cb = new Array(class_number).fill(0);
    for (let i = 0; i < class_number; i++) {
        for (let j = 0; j < class_number; j++) {
            if (i === j) continue;
            tmp_pd[i] += alphaShape_distance[i][j] * (color_dis[i][j]);
        }
        tmp_pd[i] /= (class_number - 1)
        tmp_cb[i] += non_separability_weights[i] * (bg_contrast_array[i])
    }

    let local_contrast = getBaseLog(100, 1 + d3.mean(tmp_pd))
    let background_contrast = getBaseLog(100, 1 + d3.mean(tmp_cb))
    name_difference /= class_number * (class_number - 1);
    name_consistency /= class_number

    // if (DATATYPE === "LINECHART") {
    //     background_contrast *= 10
    // } else {
    //     background_contrast *= 4
    // }

    let palette_score = score_importance_weight[0] * local_contrast + score_importance_weight[1] * background_contrast + score_importance_weight[2] * name_difference + score_importance_weight[3] * name_consistency + min_cd * 0.1 + min_nd * 0.1

    if (isNaN(palette_score) || !palette_score) return -10000000
    if (sign)
        console.log(local_contrast.toFixed(2), background_contrast.toFixed(2), name_difference.toFixed(2), name_consistency.toFixed(2), palette_score.toFixed(2), min_cd.toFixed(2));

    // if (sign) {
    //     for (let i = 0; i < class_number; i++) {
    //         let bg1 = d3_ciede2000(d3.lab(palette[i]), d3.lab(d3.rgb(bgcolor)))
    //         let satisfied_constraint_num = 0
    //         for (let j = 0; j < class_number; j++) {
    //             let bg2 = d3_ciede2000(d3.lab(palette2[j]), d3.lab(d3.rgb(bgcolor)))
    //             if (bg2 < bg1) {
    //                 satisfied_constraint_num++
    //             }
    //         }
    //         console.log(satisfied_constraint_num);
    //     }

    // }

    return palette_score
}


function getBaseLog(x, y) {
    return Math.log(y) / Math.log(x);
}

/**
 * using simulated annealing to find the best palette of given data
 * @param {*} palette_size 
 * @param {*} colors_scope: hue range, luminance range, saturation range
 */
function simulatedAnnealing2FindBestPalette(palette_size, colors_scope = { "hue_scope": [0, 360], "chroma_scope": [20, 100], "lumi_scope": [35, 85] }) {
    let iterate_times = 0;
    //default parameters
    let max_temper = 100000,
        dec = decline_rate,
        max_iteration_times = 10000000,
        end_temper = 0.001;
    cur_temper = max_temper;
    //generate a totally random palette
    let color_palette = []
    let bg_hcl = rgb2hcl(d3.rgb(bgcolor))
    let luminance = normScope(bg_hcl.l, [20, 90]),
        chroma = normScope(isNaN(bg_hcl.c) ? 100 - luminance : bg_hcl.c, [20, 120])

    for (let i = 0; i < palette_size; i++) {
        let hue = i * 360 / palette_size
        let hcl = formatGivenColor(d3.hcl(hue, getRandomIntInclusive(colors_scope.chroma_scope[0], colors_scope.chroma_scope[1]), getRandomIntInclusive(colors_scope.lumi_scope[0], colors_scope.lumi_scope[1])))
        color_palette.push(hcl);
    }
    for (let i = 0; i < palette_size; i++) {
        let hcl = formatGivenColor(d3.hcl(color_palette[i].h, chroma, luminance))
        color_palette[i + palette_size] = hcl
    }
    //evaluate the default palette
    let o = {
        id: color_palette,
        chroma: chroma,
        luminance: luminance,
        score: getPaletteScore(color_palette)
    },
        preferredObj = o;
    color_names_checked = collectColorNames();
    console.log("initial settings:", chroma, luminance, o.score);

    let dscores = []
    let delta_score = 0
    while (cur_temper > end_temper) {
        // console.log(iterate_times);
        for (let i = 0; i < 1; i++) { //disturb at each temperature
            iterate_times++;
            color_palette = o.id.slice()
            disturbColors(color_palette, colors_scope, Math.exp((-delta_score - 0.1) / cur_temper), chroma, luminance);
            let o2 = {
                id: color_palette,
                chroma: chroma,
                luminance: luminance,
                score: getPaletteScore(color_palette)
            };

            delta_score = o.score - o2.score;
            let prob = Math.exp((-delta_score - 0.1) / cur_temper)
            dscores.push([iterate_times, prob > 1 ? 1 : prob])
            if (delta_score <= 0 || delta_score > 0 && Math.random() <= prob) {
                o = o2;
                if (preferredObj.score - o.score < 0) {
                    preferredObj = o;
                }
            }
            if (iterate_times > max_iteration_times) {
                break;
            }
        }

        cur_temper *= dec;
    }
    // if (preferredObj.score > 0) {
    //     console.log(dscores);
    //     showTrend(dscores)
    //     showTrend(dscores, 0, 2)
    //     showTrend(dscores, 0, 3)
    // }
    return preferredObj;
}

function m_disturbHue(hue) {
    let h = hue + getRandomIntInclusive(-50, 50)
    if (h < 0) {
        return 360 + h
    }
    if (h > 360) {
        return h % 360
    }
    return h
}

function formatGivenColor(color) {
    return rgb2hcl(hcl2rgb(color))
    let hcl = color
    let rgb = hcl2rgb(hcl)
    rgb = d3.rgb(norm255(rgb.r), norm255(rgb.g), norm255(rgb.b))
    hcl = rgb2hcl(rgb)
    return hcl
}

function randomDisturbColors(palette, chroma, luminance, colors_scope) {
    let disturb_step = 10;
    // random disturb one color
    let idx = getRandomIntInclusive(0, palette.length / 2 - 1), loop_count = 0
    palette[idx] = d3.hcl(normScope(m_disturbHue(palette[idx].h), colors_scope.hue_scope), normScope(chroma[0] + getRandomIntInclusive(-disturb_step, disturb_step), colors_scope.chroma_scope), normScope(luminance[0] + getRandomIntInclusive(-disturb_step, disturb_step), colors_scope.lumi_scope))
    palette[idx] = formatGivenColor(palette[idx])

    palette[idx + palette.length / 2] = d3.hcl(palette[idx].h, normScope(chroma[1] + getRandomIntInclusive(-disturb_step, disturb_step), colors_scope.chroma_scope), normScope(luminance[1] + getRandomIntInclusive(-disturb_step, disturb_step), colors_scope.lumi_scope))
    palette[idx + palette.length / 2] = formatGivenColor(palette[idx + palette.length / 2])
    // do {
    //     palette[idx] = d3.hcl(normScope(m_disturbHue(palette[idx].h), colors_scope.hue_scope), normScope(chroma[0] + getRandomIntInclusive(-disturb_step, disturb_step), colors_scope.chroma_scope), normScope(luminance[0] + getRandomIntInclusive(-disturb_step, disturb_step), colors_scope.lumi_scope))
    //     console.log(3);
    //     loop_count++
    //     if (loop_count > 10) {
    //         loop_count = 0
    //         chroma[0] += getRandomIntInclusive(-disturb_step, disturb_step)
    //         chroma[0] = normScope(chroma[0], colors_scope.chroma_scope)
    //         luminance[0] += getRandomIntInclusive(-disturb_step, disturb_step)
    //         luminance[0] = normScope(luminance[0], colors_scope.lumi_scope)
    //     }
    // } while (getColorNameIndex(palette[idx]) != undefined)

    // loop_count = 0
    // do {
    //     palette[idx + palette.length / 2] = d3.hcl(palette[idx].h, normScope(chroma[1] + getRandomIntInclusive(-disturb_step, disturb_step), colors_scope.chroma_scope), normScope(luminance[1] + getRandomIntInclusive(-disturb_step, disturb_step), colors_scope.lumi_scope))
    //     console.log(4);
    //     loop_count++
    //     if (loop_count > 10) {
    //         loop_count = 0
    //         chroma[1] += getRandomIntInclusive(-disturb_step, disturb_step)
    //         chroma[1] = normScope(chroma[1], colors_scope.chroma_scope)
    //         luminance[1] += getRandomIntInclusive(-disturb_step, disturb_step)
    //         luminance[1] = normScope(luminance[1], colors_scope.lumi_scope)
    //     }
    // } while (getColorNameIndex(palette[idx + palette.length / 2]) != undefined)

    let count = 0,
        sign;
    while (true) {
        while ((sign = isDiscriminative(palette)) > 0) {
            count += 1;
            if (count === 100) break;
            sign = sign % (palette.length / 2)
            palette[sign] = d3.hcl(normScope(m_disturbHue(palette[sign].h), colors_scope.hue_scope), normScope(chroma[0] + getRandomIntInclusive(-disturb_step, disturb_step), colors_scope.chroma_scope), normScope(luminance[0] + getRandomIntInclusive(-disturb_step, disturb_step), colors_scope.lumi_scope))
            palette[sign] = formatGivenColor(palette[sign])
            palette[sign + palette.length / 2] = d3.hcl(palette[sign].h, normScope(chroma[1] + getRandomIntInclusive(-disturb_step, disturb_step), colors_scope.chroma_scope), normScope(luminance[1] + getRandomIntInclusive(-disturb_step, disturb_step), colors_scope.lumi_scope))
            palette[sign + palette.length / 2] = formatGivenColor(palette[sign + palette.length / 2])
            // loop_count = 0
            // do {
            //     palette[sign] = d3.hcl(normScope(m_disturbHue(palette[sign].h), colors_scope.hue_scope), normScope(chroma[0] + getRandomIntInclusive(-disturb_step, disturb_step), colors_scope.chroma_scope), normScope(luminance[0] + getRandomIntInclusive(-disturb_step, disturb_step), colors_scope.lumi_scope))
            //     console.log(5);
            //     loop_count++
            //     if (loop_count > 10) {
            //         loop_count = 0
            //         chroma[0] += getRandomIntInclusive(-disturb_step, disturb_step)
            //         chroma[0] = normScope(chroma[0], colors_scope.chroma_scope)
            //         luminance[0] += getRandomIntInclusive(-disturb_step, disturb_step)
            //         luminance[0] = normScope(luminance[0], colors_scope.lumi_scope)
            //     }
            // } while (getColorNameIndex(palette[sign]) != undefined)

            // loop_count = 0
            // do {
            //     palette[sign + palette.length / 2] = d3.hcl(palette[sign].h, normScope(chroma[1] + getRandomIntInclusive(-disturb_step, disturb_step), colors_scope.chroma_scope), normScope(luminance[1] + getRandomIntInclusive(-disturb_step, disturb_step), colors_scope.lumi_scope))
            //     loop_count++
            //     if (loop_count > 10) {
            //         loop_count = 0
            //         chroma[1] += getRandomIntInclusive(-disturb_step, disturb_step)
            //         chroma[1] = normScope(chroma[1], colors_scope.chroma_scope)
            //         luminance[1] += getRandomIntInclusive(-disturb_step, disturb_step)
            //         luminance[1] = normScope(luminance[1], colors_scope.lumi_scope)
            //     }
            // } while (getColorNameIndex(palette[sign + palette.length / 2]) != undefined)

        }
        let satisfy_color_name = true;
        if (color_names_checked.length > 0) {
            for (let i = 0; i < palette.length; i++) {
                let c = getColorNameIndex(d3.rgb(palette[i])),
                    t = c3.color.relatedTerms(c, 1);
                if (t[0] === undefined || color_names_checked.indexOf(c3.terms[t[0].index]) === -1) {
                    rgb = best_color_names[color_names_checked[getRandomIntInclusive(0, color_names_checked.length - 1)]]
                    palette[i] = d3.rgb(norm255(rgb.r + getRandomIntInclusive(-10, 10)), norm255(rgb.g + getRandomIntInclusive(-10, 10)), norm255(rgb.b + getRandomIntInclusive(-10, 10)))
                    satisfy_color_name = false;
                }
            }
        }

        if (satisfy_color_name || count >= 100) break;
    }

}

function isDiscriminative(palette) {
    let class_number = palette.length / 2
    for (let i = 0; i < class_number; i++) {
        for (let j = i + 1; j < class_number; j++) {
            let color_dis = d3_ciede2000(d3.lab(palette[i]), d3.lab(palette[j]));
            if (color_dis < 10) {
                return j;
            }
        }
    }
    return -1;
}

function m_disturbCL(v, range) {
    let step = 15
    return normScope(v + getRandomIntInclusive(-50, 50), range)
    let result = normScope(v + (Math.random() > 0.5 ? getRandomIntInclusive(step, step + 50) : -getRandomIntInclusive(step, step + 50)), range)
    while (Math.abs(result - v) < step) {
        result = normScope(v + (Math.random() > 0.5 ? getRandomIntInclusive(step, step + 50) : -getRandomIntInclusive(step, step + 50)), range)
    }
    return result
}
/**
 * @param {} palette 
 * @param {*} colors_scope 
 */
function disturbColors(palette, colors_scope, prob, chroma, luminance) {

    let class_number = palette.length / 2
    let disturb_step = 5;

    if (Math.random() < 0.5) {
        // random exchange two colors
        let idx_0 = getRandomIntInclusive(0, class_number - 1),
            idx_1 = getRandomIntInclusive(0, class_number - 1);
        while (idx_0 === idx_1) {
            idx_1 = getRandomIntInclusive(0, class_number - 1);
        }
        let tmp = palette[idx_0];
        palette[idx_0] = palette[idx_1];
        palette[idx_1] = tmp;

        tmp = palette[idx_0 + class_number];
        palette[idx_0 + class_number] = palette[idx_1 + class_number];
        palette[idx_1 + class_number] = tmp;
    } else {
        disturb_step = 10;
        // random disturb one color
        let idx = getRandomIntInclusive(0, palette.length / 2 - 1)
        let curr_best_num = -1000, satisfied_constraint_num = 0
        let bg0 = 0, bg1 = 1,
            curr_best_0 = palette[idx],
            curr_best_1 = palette[idx + palette.length / 2]
        for (let i = 0; i < 10; i++) {

            do {
                palette[idx] = d3.hcl(normScope(m_disturbHue(palette[idx].h), colors_scope.hue_scope), m_disturbCL(palette[idx].c, colors_scope.chroma_scope), m_disturbCL(palette[idx].l, colors_scope.lumi_scope))
                palette[idx] = formatGivenColor(palette[idx])

                if (palette[idx].h >= 85 && palette[idx].h <= 114 && palette[idx].l >= 35 && palette[idx].l <= 75) {
                    if (Math.abs(palette[idx].h - 85) > Math.abs(palette[idx].h - 114)) {
                        palette[idx].h = 115;
                    } else {
                        palette[idx].h = 84;
                    }
                }

                palette[idx + palette.length / 2] = d3.hcl(palette[idx].h, chroma + getRandomIntInclusive(-disturb_step, disturb_step), luminance + getRandomIntInclusive(-disturb_step, disturb_step))
                palette[idx + palette.length / 2] = formatGivenColor(palette[idx + palette.length / 2])

                if (Math.abs(chroma - palette[idx + palette.length / 2].c) > disturb_step || Math.abs(luminance - palette[idx + palette.length / 2].l) > disturb_step) continue

                if (palette[idx + palette.length / 2].h >= 85 && palette[idx + palette.length / 2].h <= 114 && palette[idx + palette.length / 2].l >= 35 && palette[idx + palette.length / 2].l <= 75) {
                    if (Math.abs(palette[idx + palette.length / 2].h - 85) > Math.abs(palette[idx + palette.length / 2].h - 114)) {
                        palette[idx + palette.length / 2].h = 115;
                    } else {
                        palette[idx + palette.length / 2].h = 84;
                    }
                }



                bg0 = d3_ciede2000(d3.lab(palette[idx]), d3.lab(d3.rgb(bgcolor))), bg1 = d3_ciede2000(d3.lab(palette[idx + class_number]), d3.lab(d3.rgb(bgcolor)))
            } while (bg0 - 10 < bg1)

            satisfied_constraint_num = 0
            for (let j = 0; j < class_number; j++) {
                if (idx === j) continue
                let bg2 = d3_ciede2000(d3.lab(palette[j + class_number]), d3.lab(d3.rgb(bgcolor)))
                if (bg2 < bg0 - 10) {
                    satisfied_constraint_num++
                }
            }
            if (curr_best_num < satisfied_constraint_num) {
                curr_best_num = satisfied_constraint_num
                curr_best_0 = palette[idx]
                curr_best_1 = palette[idx + palette.length / 2]
            }
            // if (satisfied_constraint_num != class_number - 1)
            //     console.log(satisfied_constraint_num);
            if (satisfied_constraint_num === class_number - 1) {
                break
            }
        }
        palette[idx] = curr_best_0
        palette[idx + palette.length / 2] = curr_best_1

        let count = 0
        while ((idx = isDiscriminative(palette)) > 0) {
            count += 1;
            if (count === 100) break;

            bg0 = 0, bg1 = 1
            curr_best_0 = palette[idx]
            curr_best_1 = palette[idx + palette.length / 2]
            curr_best_num = -1000
            for (let i = 0; i < 10; i++) {

                do {
                    palette[idx] = d3.hcl(normScope(m_disturbHue(palette[idx].h), colors_scope.hue_scope), m_disturbCL(palette[idx].c, colors_scope.chroma_scope), m_disturbCL(palette[idx].l, colors_scope.lumi_scope))
                    palette[idx] = formatGivenColor(palette[idx])

                    if (palette[idx].h >= 85 && palette[idx].h <= 114 && palette[idx].l >= 35 && palette[idx].l <= 75) {
                        if (Math.abs(palette[idx].h - 85) > Math.abs(palette[idx].h - 114)) {
                            palette[idx].h = 115;
                        } else {
                            palette[idx].h = 84;
                        }
                    }

                    palette[idx + palette.length / 2] = d3.hcl(palette[idx].h, chroma + getRandomIntInclusive(-disturb_step, disturb_step), luminance + getRandomIntInclusive(-disturb_step, disturb_step))
                    palette[idx + palette.length / 2] = formatGivenColor(palette[idx + palette.length / 2])

                    if (Math.abs(chroma - palette[idx + palette.length / 2].c) > disturb_step || Math.abs(luminance - palette[idx + palette.length / 2].l) > disturb_step) continue

                    if (palette[idx + palette.length / 2].h >= 85 && palette[idx + palette.length / 2].h <= 114 && palette[idx + palette.length / 2].l >= 35 && palette[idx + palette.length / 2].l <= 75) {
                        if (Math.abs(palette[idx + palette.length / 2].h - 85) > Math.abs(palette[idx + palette.length / 2].h - 114)) {
                            palette[idx + palette.length / 2].h = 115;
                        } else {
                            palette[idx + palette.length / 2].h = 84;
                        }
                    }

                    bg0 = d3_ciede2000(d3.lab(palette[idx]), d3.lab(d3.rgb(bgcolor))), bg1 = d3_ciede2000(d3.lab(palette[idx + class_number]), d3.lab(d3.rgb(bgcolor)))
                } while (bg0 - 10 < bg1)

                satisfied_constraint_num = 0
                for (let j = 0; j < class_number; j++) {
                    if (idx === j) continue
                    let bg2 = d3_ciede2000(d3.lab(palette[j + class_number]), d3.lab(d3.rgb(bgcolor)))
                    if (bg2 < bg0 - 10) {
                        satisfied_constraint_num++
                    }
                }
                if (curr_best_num < satisfied_constraint_num) {
                    curr_best_num = satisfied_constraint_num
                    curr_best_0 = palette[idx]
                    curr_best_1 = palette[idx + palette.length / 2]
                }
                // if (satisfied_constraint_num != class_number - 1)
                //     console.log(satisfied_constraint_num);
                if (satisfied_constraint_num === class_number - 1) {
                    break
                }
            }
            palette[idx] = curr_best_0
            palette[idx + palette.length / 2] = curr_best_1

        }
    }

    // console.log(1, chroma, luminance);
    return [chroma, luminance]
}
function disturbColors2(palette, colors_scope, prob, chroma, luminance) {

    let class_number = palette.length / 2
    let disturb_step = 10;

    // disturb the chroma and luminance
    if (Math.random() < prob) {
        // find a new baseline
        let sign = true, count = 0, max_diff = -100000, tmp_chroma = chroma, tmp_lumi = luminance, tmp_palette = palette.slice()
        while (sign) {
            sign = false;
            disturb_step = 10;
            let is_satisfied = true
            for (let n = 0; n < 100; n++) {
                is_satisfied = true
                chroma = chroma + getRandomIntInclusive(-5, 5)
                chroma = normScope(chroma, colors_scope.chroma_scope)
                luminance = luminance + getRandomIntInclusive(-5, 5)
                luminance = normScope(luminance, colors_scope.lumi_scope)

                for (let i = 0; i < class_number; i++) {
                    palette[i + class_number] = formatGivenColor(d3.hcl(palette[i].h, chroma, luminance))
                    if (Math.abs(palette[i + class_number].c - chroma) > disturb_step || Math.abs(palette[i + class_number].l - luminance) > disturb_step) {
                        is_satisfied = false
                        break
                    }

                    palette[i] = formatGivenColor(d3.hcl(palette[i].h, m_disturbCL(chroma, colors_scope.chroma_scope), m_disturbCL(luminance, colors_scope.lumi_scope)))
                    let loop_count = 0
                    // Math.abs(palette[i].c - chroma) < disturb_step || Math.abs(palette[i].l - luminance) < disturb_step || 
                    let bg0 = d3_ciede2000(d3.lab(palette[i]), d3.lab(d3.rgb(bgcolor))), bg1 = d3_ciede2000(d3.lab(palette[i + class_number]), d3.lab(d3.rgb(bgcolor)))
                    while (bg1 > bg0 - 10) {
                        palette[i] = formatGivenColor(d3.hcl(palette[i].h, m_disturbCL(chroma, colors_scope.chroma_scope), m_disturbCL(luminance, colors_scope.lumi_scope)))
                        bg0 = d3_ciede2000(d3.lab(palette[i]), d3.lab(d3.rgb(bgcolor)))
                        loop_count++
                        if (loop_count > 10) {
                            is_satisfied = false
                            break
                        }
                    }
                    if (!is_satisfied) break
                }
                if (is_satisfied) break
            }



            let min_diff = 10000, min_diff_0 = 10000, min_diff_1 = 10000
            for (let i = 0; i < class_number; i++) {
                let diff_0 = d3_ciede2000(d3.lab(palette[i]), d3.lab(d3.rgb(bgcolor))), diff_1 = d3_ciede2000(d3.lab(palette[i + class_number]), d3.lab(d3.rgb(bgcolor)))
                min_diff_0 = (min_diff_0 > diff_0) ? diff_0 : min_diff_0
                min_diff_1 = (min_diff_1 > diff_1) ? diff_1 : min_diff_1
                let diff = diff_0 - diff_1
                if (diff < min_diff) {
                    min_diff = diff
                }
                if (diff < 0) {
                    sign = true;
                    break
                }
            }
            if (min_diff_0 < min_diff_1) {
                sign = true;
            }
            if (max_diff < min_diff) {
                max_diff = min_diff
                tmp_chroma = chroma
                tmp_lumi = luminance
                tmp_palette = palette.slice()
            }
            count += 1
            if (count > 10) break;
        }
        chroma = tmp_chroma
        luminance = tmp_lumi
        palette = tmp_palette
    }
    // console.log(chroma, luminance);

    if (Math.random() < 0.5) {
        // random exchange two colors
        let idx_0 = getRandomIntInclusive(0, class_number - 1),
            idx_1 = getRandomIntInclusive(0, class_number - 1);
        while (idx_0 === idx_1) {
            idx_1 = getRandomIntInclusive(0, class_number - 1);
        }
        let tmp = palette[idx_0];
        palette[idx_0] = palette[idx_1];
        palette[idx_1] = tmp;

        tmp = palette[idx_0 + class_number];
        palette[idx_0 + class_number] = palette[idx_1 + class_number];
        palette[idx_1 + class_number] = tmp;
    } else {
        disturb_step = 10;
        // random disturb one color
        let idx = getRandomIntInclusive(0, palette.length / 2 - 1)
        for (let i = 0; i < 100; i++) {
            palette[idx] = d3.hcl(normScope(m_disturbHue(palette[idx].h), colors_scope.hue_scope), m_disturbCL(chroma, colors_scope.chroma_scope), m_disturbCL(luminance, colors_scope.lumi_scope))
            palette[idx] = formatGivenColor(palette[idx])

            palette[idx + palette.length / 2] = d3.hcl(palette[idx].h, normScope(chroma + getRandomIntInclusive(-disturb_step, disturb_step), colors_scope.chroma_scope), normScope(luminance + getRandomIntInclusive(-disturb_step, disturb_step), colors_scope.lumi_scope))
            palette[idx + palette.length / 2] = formatGivenColor(palette[idx + palette.length / 2])

            if (Math.abs(chroma - palette[idx + palette.length / 2].c) > disturb_step || Math.abs(luminance - palette[idx + palette.length / 2].l) > disturb_step) continue

            let bg0 = d3_ciede2000(d3.lab(palette[idx]), d3.lab(d3.rgb(bgcolor))), bg1 = d3_ciede2000(d3.lab(palette[idx + class_number]), d3.lab(d3.rgb(bgcolor)))
            if (bg1 < bg0 - 10) break
        }

        let count = 0
        while ((idx = isDiscriminative(palette)) > 0) {
            count += 1;
            if (count === 100) break;

            for (let i = 0; i < 100; i++) {
                palette[idx] = d3.hcl(normScope(m_disturbHue(palette[idx].h), colors_scope.hue_scope), m_disturbCL(chroma, colors_scope.chroma_scope), m_disturbCL(luminance, colors_scope.lumi_scope))
                palette[idx] = formatGivenColor(palette[idx])

                palette[idx + palette.length / 2] = d3.hcl(palette[idx].h, normScope(chroma + getRandomIntInclusive(-disturb_step, disturb_step), colors_scope.chroma_scope), normScope(luminance + getRandomIntInclusive(-disturb_step, disturb_step), colors_scope.lumi_scope))
                palette[idx + palette.length / 2] = formatGivenColor(palette[idx + palette.length / 2])

                if (Math.abs(chroma - palette[idx + palette.length / 2].c) > disturb_step || Math.abs(luminance - palette[idx + palette.length / 2].l) > disturb_step) continue

                let bg0 = d3_ciede2000(d3.lab(palette[idx]), d3.lab(d3.rgb(bgcolor))), bg1 = d3_ciede2000(d3.lab(palette[idx + class_number]), d3.lab(d3.rgb(bgcolor)))
                if (bg1 < bg0 - 10) break
            }

        }
    }

    // console.log(1, chroma, luminance);
    return [chroma, luminance]
}
/*****************************************************************Complete Palette******************************************************************************************************* */

/**
 * using simulated annealing to complete the current palette of given data
 */
function completePalette(origin_palette, blank_pos, colors_scope = { "hue_scope": [0, 360], "lumi_scope": [25, 85] }) {
    let iterate_times = 0;
    //default parameters
    let max_temper = 100000,
        dec = decline_rate,
        max_iteration_times = 10000000,
        end_temper = 0.001;
    cur_temper = max_temper;
    //generate a totally random palette
    let color_palette = completePaletteRandom(origin_palette, blank_pos, colors_scope, true);
    let tmp_L = Math.random(), palette_size = Object.keys(labelToClass).length;
    for (let i = 0; i < palette_size; i++) {
        let hsl = d3.hsl(color_palette[i])
        color_palette[i + palette_size] = d3.hsl(hsl.h, hsl.s, tmp_L)
    }
    //evaluate the default palette
    let o = {
        id: color_palette,
        luminance: tmp_L,
        score: getPaletteScore(color_palette)
    },
        preferredObj = o;

    color_names_checked = collectColorNames();
    let delta_score = 0
    let class_number = color_palette.length / 2
    while (cur_temper > end_temper) {
        for (let i = 0; i < 1; i++) {//disturb at each temperature
            iterate_times++;

            color_palette = completePaletteRandom(o.id, blank_pos, colors_scope);

            let luminance = o.luminance
            if (Math.random() < Math.exp((-delta_score - 0.1) / cur_temper)) {
                // find a new baseline luminance
                let sign = true, count = 0
                while (sign) {
                    sign = false;
                    luminance = luminance + getRandomIntInclusive((luminance - 0.1 < 0) ? (-luminance * 100) : (-10), (luminance + 0.1 > 1) ? ((1 - luminance) * 100) : 10) * 0.01
                    for (let i = 0; i < class_number; i++) {
                        let hsl = d3.hsl(color_palette[i])
                        color_palette[i + class_number] = d3.hsl(hsl.h, hsl.s, luminance)
                        if (d3_ciede2000(d3.lab(color_palette[i]), d3.lab(bgcolor)) < d3_ciede2000(d3.lab(color_palette[i + class_number]), d3.lab(bgcolor))) {
                            sign = true;
                            break
                        }
                    }
                    count += 1
                    if (count > 100) break;
                }
            } else {
                // disturb the luminance of a random color in a range [-0.05, 0.05]
                let sign = true, count = 0
                let idx = getRandomIntInclusive(0, class_number - 1)
                while (sign) {
                    sign = false;
                    let l = luminance + getRandomIntInclusive(-5, 5) * 0.01
                    color_palette[idx + class_number] = d3.hsl(color_palette[idx + class_number].h, color_palette[idx + class_number].s, l)
                    let to_bg = d3_ciede2000(d3.lab(color_palette[idx + class_number]), d3.lab(bgcolor))
                    if (to_bg < 5 || d3_ciede2000(d3.lab(color_palette[idx]), d3.lab(bgcolor)) < to_bg) {
                        sign = true;
                        break
                    }
                    count += 1
                    if (count > 100) break;
                }
            }

            let o2 = {
                id: color_palette,
                luminance: luminance,
                score: getPaletteScore(color_palette)
            };

            delta_score = o.score - o2.score;
            let prob = Math.exp((-delta_score - 0.1) / cur_temper)
            if (delta_score <= 0 || delta_score > 0 && Math.random() <= prob) {
                o = o2;
                if (preferredObj.score - o.score < 0) {
                    preferredObj = o;
                }
            }
            if (iterate_times > max_iteration_times) {
                break;
            }
        }

        cur_temper *= dec;
    }
    return preferredObj;
}

function completePaletteRandom(ori_palette, pos, colors_scope, start = false) {

    let palette = ori_palette.slice();
    let class_number = palette.length / 2
    if (start)
        for (let i = 0; i < pos.length; i++) {
            let rgb = d3.rgb(getRandomIntInclusive(0, 255), getRandomIntInclusive(0, 255), getRandomIntInclusive(0, 255));
            palette[pos[i]] = rgb;
        }
    else {
        if (Math.random() <= 1) {
            let pos_colors = [], fixed_colors = [];
            for (let i = 0; i < class_number; i++) {
                if (pos.indexOf(i) != -1)
                    pos_colors.push([palette[i], i]);
                else
                    fixed_colors.push([palette[i], i]);
            }
            let disturb_step = 50;
            // random disturb one color
            let idx = pos[getRandomIntInclusive(0, pos.length - 1)],
                rgb = d3.rgb(palette[idx]),
                color = d3.rgb(norm255(rgb.r + getRandomIntInclusive(-disturb_step, disturb_step)), norm255(rgb.g + getRandomIntInclusive(-disturb_step, disturb_step)), norm255(rgb.b + getRandomIntInclusive(-disturb_step, disturb_step))),
                hcl = d3.hcl(color);
            color = d3.rgb(d3.hcl(normScope(hcl.h, colors_scope.hue_scope), normScope(hcl.c, [0, 100]), normScope(hcl.l, colors_scope.lumi_scope)));
            palette[idx] = d3.rgb(norm255(color.r), norm255(color.g), norm255(color.b));
            let hsl = d3.hsl(palette[idx]), hsl1 = palette[idx + class_number]
            palette[idx + class_number] = d3.hsl(hsl.h, hsl.s, hsl1.l)
            let count = 0, sign;
            while (true) {
                while ((sign = isDiscriminative2(pos_colors, fixed_colors))[0] >= 0) {
                    count += 1;
                    if (count === 100) break;
                    rgb = d3.rgb(palette[sign[0]])
                    color = d3.rgb(norm255(rgb.r + getRandomIntInclusive(-disturb_step, disturb_step)), norm255(rgb.g + getRandomIntInclusive(-disturb_step, disturb_step)), norm255(rgb.b + getRandomIntInclusive(-disturb_step, disturb_step)))
                    hcl = d3.hcl(color);
                    if (hcl.h >= 85 && hcl.h <= 114 && hcl.l >= 35 && hcl.l <= 75) {
                        if (Math.abs(hcl.h - 85) > Math.abs(hcl.h - 114)) {
                            hcl.h = 115;
                        } else {
                            hcl.h = 84;
                        }
                    }
                    palette[sign[0]] = d3.rgb(d3.hcl(normScope(hcl.h, colors_scope.hue_scope), normScope(hcl.c, [0, 100]), normScope(hcl.l, colors_scope.lumi_scope)));

                    hsl = d3.hsl(palette[sign[0]]), hsl1 = palette[sign[0] + class_number]
                    palette[sign[0] + class_number] = d3.hsl(hsl.h, hsl.s, hsl1.l)
                    pos_colors[sign[1]][0] = palette[sign[0]];
                }
                let satisfy_color_name = true;
                if (color_names_checked.length > 0) {
                    for (let i = 0; i < pos.length; i++) {
                        let c = getColorNameIndex(d3.rgb(palette[pos[i]])),
                            t = c3.color.relatedTerms(c, 1);
                        if (t[0] === undefined || color_names_checked.indexOf(c3.terms[t[0].index]) === -1) {
                            rgb = best_color_names[color_names_checked[getRandomIntInclusive(0, color_names_checked.length - 1)]]
                            palette[pos[i]] = d3.rgb(norm255(rgb.r + getRandomIntInclusive(-10, 10)), norm255(rgb.g + getRandomIntInclusive(-10, 10)), norm255(rgb.b + getRandomIntInclusive(-10, 10)))
                            satisfy_color_name = false;
                        }
                    }
                }

                if (satisfy_color_name || count >= 100) break;
            }
        } else if (pos.length >= 2) {
            // randomly shuffle two colors of the palette 
            let idx_0 = pos[getRandomIntInclusive(0, pos.length - 1)],
                idx_1 = pos[getRandomIntInclusive(0, pos.length - 1)];
            while (idx_0 === idx_1) {
                idx_1 = pos[getRandomIntInclusive(0, pos.length - 1)];
            }
            let tmp = palette[idx_0];
            palette[idx_0] = palette[idx_1];
            palette[idx_1] = tmp;
        }
    }
    return palette;
}

function isDiscriminative2(pos_colors, fixed_colors) {
    let idx = -1;
    for (let i = 0; i < fixed_colors.length; i++) {
        for (let j = 0; j < pos_colors.length; j++) {
            let color_dis = d3_ciede2000(d3.lab(fixed_colors[i][0]), d3.lab(pos_colors[j][0]));
            if (color_dis < 10) {
                return [pos_colors[j][1], j];
            }
        }
    }
    for (let j = 0; j < pos_colors.length; j++)
        for (let k = j + 1; k < pos_colors.length; k++) {
            color_dis = d3_ciede2000(d3.lab(pos_colors[j][0]), d3.lab(pos_colors[k][0]));
            if (color_dis < 10) {
                return [pos_colors[j][1], k];
            }
        }
    return [idx, -1];
}

