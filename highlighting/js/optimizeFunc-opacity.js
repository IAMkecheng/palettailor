/**
 * different lightness
 */

function doColorization() {
    let class_number = Object.keys(labelToClass).length;
    //get the lightness range
    let lightnessRange = [+d3.select("#lightnessFilterRangeLow").property('value'), +d3.select("#lightnessFilterRangeHigh").property('value')];
    let colors_scope = { "hue_scope": [0, 360], "lumi_scope": lightnessRange };

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
    if (locked_pos.length === 0) {
        best_color = simulatedAnnealing2FindBestPalette(class_number, colors_scope);
        // while (best_color.score === -10000000) {
        //     best_color = simulatedAnnealing2FindBestPalette(class_number, colors_scope);
        //     getPaletteScore(best_color.id, true)
        //     console.log("re-do", best_color.lightness, best_color.score);
        // }
    }
    else {
        best_color = completePalette(origin_palette, blank_pos, colors_scope);
    }

    console.log("=======================================================");
    console.log("final lightness = ", best_color.lightness);
    console.log("final score = ", best_color.score);
    getPaletteScore(best_color.id, true)
    // if already have a svg, then insert it to the history
    addToHistory();
    let used_palette = best_color.id.slice()

    best_color = simulatedAnnealingOpacity(class_number, colors_scope);
    while (best_color.score === -10000000) {
        best_color = simulatedAnnealingOpacity(class_number, colors_scope);
        getPaletteScore(best_color.id, true)
        console.log("re-do", best_color.lightness, best_color.score);
    }
    console.log("=======================================================");
    console.log("final opacity = ", best_color.lightness);
    console.log("final score = ", best_color.score);
    getPaletteScore(best_color.id, true)
    appendScatterplot(best_color.id.slice())
    appendPaletteResult(best_color.id.slice());
    d3.select(".paletteDiv").append("br")

    let background_color = d3.rgb(bgcolor)
    let used_palette_0 = best_color.id.slice()
    for (let i = 0; i < class_number; i++) {
        let color = d3.rgb(used_palette_0[i])
        let color1 = traditionalColorBlending([color.r, color.g, color.b, 0.25], [background_color.r, background_color.g, background_color.b, 1])
        used_palette_0[i + class_number] = d3.rgb(color1[0], color1[1], color1[2])
    }
    console.log("=======================================================");
    console.log("opacity 0.25:");
    getPaletteScore(used_palette_0, true)
    appendScatterplot(used_palette_0)
    appendPaletteResult(used_palette_0);
    d3.select(".paletteDiv").append("br")

    used_palette_0 = Tableau_10_palette.slice(0, class_number)//["#60ffc0", "#e1a01b", "#36a800", "#836265", "#fe002e", "#047ae3", "#5dc5d5", "#eefb04", "#fe62c2", "#9138e9"]
    used_palette_0 = used_palette_0.concat(used_palette_0)
    for (let i = 0; i < class_number; i++) {
        let color = d3.rgb(used_palette_0[i])
        let color1 = traditionalColorBlending([color.r, color.g, color.b, 0.25], [background_color.r, background_color.g, background_color.b, 1])
        used_palette_0[i + class_number] = d3.rgb(color1[0], color1[1], color1[2])
    }
    console.log("=======================================================");
    console.log("opacity 0.25:");
    appendScatterplot(used_palette_0)
    appendPaletteResult(used_palette_0);
    d3.select(".paletteDiv").append("br")

    used_palette_0 = used_palette.slice()
    for (let i = 0; i < class_number; i++) {
        used_palette_0[i + class_number] = "#ccc"
    }
    console.log("=======================================================");
    appendScatterplot(used_palette_0)
    appendPaletteResult(used_palette_0);
    d3.select(".paletteDiv").append("br")

    used_palette_0 = used_palette.slice()
    for (let i = 0; i < class_number; i++) {
        let color = d3.rgb(used_palette_0[i])
        let color1 = traditionalColorBlending([color.r, color.g, color.b, 0.25], [background_color.r, background_color.g, background_color.b, 1])
        used_palette_0[i + class_number] = d3.rgb(color1[0], color1[1], color1[2])
    }
    console.log("=======================================================");
    console.log("opacity 0.25:");
    getPaletteScore(used_palette_0, true)
    appendScatterplot(used_palette_0)
    appendPaletteResult(used_palette_0);
    d3.select(".paletteDiv").append("br")

    drawTransferFunction(used_palette);

    return used_palette;
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

    let palette_score = score_importance_weight[0] * local_contrast + score_importance_weight[1] * background_contrast * 5 + score_importance_weight[2] * name_difference * 2 - score_importance_weight[3] * name_consistency + min_cd * 0.1 //+ min_nd * 0.1

    if (isNaN(palette_score) || !palette_score) return -10000000
    if (sign)
        console.log(local_contrast.toFixed(2), background_contrast.toFixed(2), name_difference.toFixed(2), name_consistency.toFixed(2), palette_score.toFixed(2), min_cd.toFixed(2), min_nd.toFixed(2));
    return palette_score
}

function getPaletteScore2(p, sign = false) {
    let class_number = p.length / 2
    let palette = p.slice(0, class_number);
    let palette2 = p.slice(class_number, p.length);

    let color_dis = new Array(class_number), name_dis = new Array(class_number)
    for (let i = 0; i < class_number; i++) {
        color_dis[i] = new Array(class_number)
        name_dis[i] = new Array(class_number)
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

        for (let j = i + 1; j < class_number; j++) {
            // local contrast
            let cd_0 = d3_ciede2000(d3.lab(palette[i]), d3.lab(palette[j])),
                cd_1 = d3_ciede2000(d3.lab(palette2[i]), d3.lab(palette2[j]))
            if (cd_0 < 10 || cd_1 < 5) return -10000000
            color_dis[i][j] = color_dis[j][i] = (cd_0 + cd_1)

            min_cd = min_cd > cd_0 ? cd_0 : min_cd
            // min_cd = min_cd > cd_1 ? cd_1 : min_cd

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

    if (DATATYPE === "LINECHART") {
        background_contrast *= 10
    } else {
        background_contrast *= 4
    }

    let palette_score = score_importance_weight[0] * local_contrast + score_importance_weight[1] * background_contrast + score_importance_weight[2] * name_difference + score_importance_weight[3] * name_consistency + min_cd * 0.1

    if (isNaN(palette_score) || !palette_score) return -10000000
    if (sign)
        console.log(local_contrast.toFixed(2), background_contrast.toFixed(2), name_difference.toFixed(2), name_consistency.toFixed(2), palette_score.toFixed(2), min_cd.toFixed(2), min_nd.toFixed(2));
    return palette_score
}


function getBaseLog(x, y) {
    return Math.log(y) / Math.log(x);
}

/**
 * using simulated annealing to find the best palette of given data
 * @param {*} palette_size 
 * @param {*} colors_scope: hue range, lightness range, saturation range
 */
function simulatedAnnealing2FindBestPalette(palette_size, colors_scope = { "hue_scope": [0, 360], "lumi_scope": [35, 85] }) {
    let iterate_times = 0;
    //default parameters
    let max_temper = 100000,
        dec = decline_rate,
        max_iteration_times = 10000000,
        end_temper = 0.001;
    cur_temper = max_temper;
    //generate a totally random palette
    let color_palette = getColorPaletteRandom(palette_size);
    let tmp_L = Math.random()
    for (let i = 0; i < palette_size; i++) {
        let hsl = d3.hsl(color_palette[i])
        color_palette[i + palette_size] = d3.hsl(hsl.h, hsl.s, tmp_L)
    }
    //evaluate the default palette
    let o = {
        id: color_palette,
        lightness: tmp_L,
        score: getPaletteScore(color_palette)
    },
        preferredObj = o;
    color_names_checked = collectColorNames();

    let delta_score = 0
    while (cur_temper > end_temper) {
        for (let i = 0; i < 1; i++) { //disturb at each temperature
            iterate_times++;
            color_palette = o.id.slice();
            let lightness = o.lightness
            lightness = disturbColors(color_palette, colors_scope, Math.exp((-delta_score - 0.1) / cur_temper), lightness);
            let color_palette_2 = color_palette.slice();
            let o2 = {
                id: color_palette_2,
                lightness: lightness,
                score: getPaletteScore(color_palette_2)
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


function getColorPaletteRandom(palette_size) {
    let palette = [];
    for (let i = 0; i < palette_size; i++) {
        let rgb = d3.rgb(getRandomIntInclusive(0, 255), getRandomIntInclusive(0, 255), getRandomIntInclusive(0, 255));
        palette.push(rgb);
    }
    return palette;
}

function randomDisturbColors(palette, colors_scope) {
    let disturb_step = 50;
    // random disturb one color
    let idx = getRandomIntInclusive(0, palette.length / 2 - 1),
        rgb = d3.rgb(palette[idx]),
        color = d3.rgb(norm255(rgb.r + getRandomIntInclusive(-disturb_step, disturb_step)), norm255(rgb.g + getRandomIntInclusive(-disturb_step, disturb_step)), norm255(rgb.b + getRandomIntInclusive(-disturb_step, disturb_step)))

    // let disliked_color_name = "grey"
    // while (getColorName(color) === disliked_color_name) {
    //     color = d3.rgb(norm255(rgb.r + getRandomIntInclusive(-disturb_step, disturb_step)), norm255(rgb.g + getRandomIntInclusive(-disturb_step, disturb_step)), norm255(rgb.b + getRandomIntInclusive(-disturb_step, disturb_step)))
    // }

    let hcl = rgb2hcl(color);
    color = hcl2rgb(d3.hcl(normScope(hcl.h, colors_scope.hue_scope), normScope(hcl.c, [0, 100]), normScope(hcl.l, colors_scope.lumi_scope)));
    palette[idx] = d3.rgb(norm255(color.r), norm255(color.g), norm255(color.b));
    let hsl = d3.hsl(palette[idx]), hsl1 = palette[idx + palette.length / 2]
    palette[idx + palette.length / 2] = d3.hsl(hsl.h, hsl.s, hsl1.l)
    let count = 0,
        sign;
    while (true) {
        while ((sign = isDiscriminative(palette.slice(0, palette.length / 2))) > 0) {
            count += 1;
            if (count === 100) break;
            rgb = d3.rgb(palette[sign])
            color = d3.rgb(norm255(rgb.r + getRandomIntInclusive(-disturb_step, disturb_step)), norm255(rgb.g + getRandomIntInclusive(-disturb_step, disturb_step)), norm255(rgb.b + getRandomIntInclusive(-disturb_step, disturb_step)))
            // while (getColorName(color) === disliked_color_name) {
            //     color = d3.rgb(norm255(rgb.r + getRandomIntInclusive(-disturb_step, disturb_step)), norm255(rgb.g + getRandomIntInclusive(-disturb_step, disturb_step)), norm255(rgb.b + getRandomIntInclusive(-disturb_step, disturb_step)))
            // }
            hcl = rgb2hcl(color);
            if (hcl.h >= 85 && hcl.h <= 114 && hcl.l >= 35 && hcl.l <= 75) {
                if (Math.abs(hcl.h - 85) > Math.abs(hcl.h - 114)) {
                    hcl.h = 115;
                } else {
                    hcl.h = 84;
                }
            }
            palette[sign] = hcl2rgb(d3.hcl(normScope(hcl.h, colors_scope.hue_scope), normScope(hcl.c, [0, 100]), normScope(hcl.l, colors_scope.lumi_scope)));
            hsl = d3.hsl(palette[sign]), hsl1 = palette[sign + palette.length / 2]
            palette[sign + palette.length / 2] = d3.hsl(hsl.h, hsl.s, hsl1.l)
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

/**
 * @param {} palette 
 * @param {*} colors_scope 
 */
function disturbColors(palette, colors_scope, prob, lightness) {

    let class_number = palette.length / 2

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
        randomDisturbColors(palette, colors_scope);
    }

    // disturb the lightness
    if (Math.random() < prob) {
        // find a new baseline lightness
        let sign = true, count = 0
        while (sign) {
            sign = false;
            lightness = lightness + getRandomIntInclusive((lightness - 0.1 < 0) ? (-lightness * 100) : (-10), (lightness + 0.1 > 1) ? ((1 - lightness) * 100) : 10) * 0.01
            for (let i = 0; i < class_number; i++) {
                let hsl = d3.hsl(palette[i])
                palette[i + class_number] = d3.hsl(hsl.h, hsl.s, lightness)
                if (d3_ciede2000(d3.lab(palette[i]), d3.lab(bgcolor)) < d3_ciede2000(d3.lab(palette[i + class_number]), d3.lab(bgcolor))) {
                    sign = true;
                    break
                }
            }
            count += 1
            if (count > 100) break;
        }
    } else {
        // disturb the lightness of a random color in a range [-0.05, 0.05]
        let sign = true, count = 0
        let idx = getRandomIntInclusive(0, class_number - 1)
        while (sign) {
            sign = false;
            let l = lightness + getRandomIntInclusive(-5, 5) * 0.01
            palette[idx + class_number] = d3.hsl(palette[idx + class_number].h, palette[idx + class_number].s, l)
            let to_bg = d3_ciede2000(d3.lab(palette[idx + class_number]), d3.lab(bgcolor))
            if (to_bg < 5 || d3_ciede2000(d3.lab(palette[idx]), d3.lab(bgcolor)) < to_bg * 2) {
                sign = true;
                break
            }
            count += 1
            if (count > 100) break;
        }
    }

    return lightness

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
        lightness: tmp_L,
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

            let lightness = o.lightness
            if (Math.random() < Math.exp((-delta_score - 0.1) / cur_temper)) {
                // find a new baseline lightness
                let sign = true, count = 0
                while (sign) {
                    sign = false;
                    lightness = lightness + getRandomIntInclusive((lightness - 0.1 < 0) ? (-lightness * 100) : (-10), (lightness + 0.1 > 1) ? ((1 - lightness) * 100) : 10) * 0.01
                    for (let i = 0; i < class_number; i++) {
                        let hsl = d3.hsl(color_palette[i])
                        color_palette[i + class_number] = d3.hsl(hsl.h, hsl.s, lightness)
                        if (d3_ciede2000(d3.lab(color_palette[i]), d3.lab(bgcolor)) < d3_ciede2000(d3.lab(color_palette[i + class_number]), d3.lab(bgcolor))) {
                            sign = true;
                            break
                        }
                    }
                    count += 1
                    if (count > 100) break;
                }
            } else {
                // disturb the lightness of a random color in a range [-0.05, 0.05]
                let sign = true, count = 0
                let idx = getRandomIntInclusive(0, class_number - 1)
                while (sign) {
                    sign = false;
                    let l = lightness + getRandomIntInclusive(-5, 5) * 0.01
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
                lightness: lightness,
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


/*****************************************************************Optimizing Opacity******************************************************************************************************* */
function traditionalColorBlending(a, b) {
    var mix = [];
    mix[3] = 1 - (1 - a[3]) * (1 - b[3]); // alpha
    mix[0] = (a[0] * a[3] / mix[3]) + (b[0] * b[3] * (1 - a[3]) / mix[3]); // red
    mix[1] = (a[1] * a[3] / mix[3]) + (b[1] * b[3] * (1 - a[3]) / mix[3]); // green
    mix[2] = (a[2] * a[3] / mix[3]) + (b[2] * b[3] * (1 - a[3]) / mix[3]); // blue
    return mix;
}

function randomDisturbColorsOpacity(palette, opacity, colors_scope) {
    let disturb_step = 50;
    // random disturb one color
    let idx = getRandomIntInclusive(0, palette.length / 2 - 1),
        rgb = d3.rgb(palette[idx]),
        color = d3.rgb(norm255(rgb.r + getRandomIntInclusive(-disturb_step, disturb_step)), norm255(rgb.g + getRandomIntInclusive(-disturb_step, disturb_step)), norm255(rgb.b + getRandomIntInclusive(-disturb_step, disturb_step)))

    // let disliked_color_name = "grey"
    // while (getColorName(color) === disliked_color_name) {
    //     color = d3.rgb(norm255(rgb.r + getRandomIntInclusive(-disturb_step, disturb_step)), norm255(rgb.g + getRandomIntInclusive(-disturb_step, disturb_step)), norm255(rgb.b + getRandomIntInclusive(-disturb_step, disturb_step)))
    // }
    let background_color = d3.rgb(bgcolor)
    let hcl = rgb2hcl(color);
    color = hcl2rgb(d3.hcl(normScope(hcl.h, colors_scope.hue_scope), normScope(hcl.c, [0, 100]), normScope(hcl.l, colors_scope.lumi_scope)));
    palette[idx] = d3.rgb(norm255(color.r), norm255(color.g), norm255(color.b));
    color = palette[idx]
    let color1 = traditionalColorBlending([color.r, color.g, color.b, opacity], [background_color.r, background_color.g, background_color.b, 1])
    palette[idx + palette.length / 2] = d3.rgb(color1[0], color1[1], color1[2])
    let count = 0,
        sign;
    while (true) {
        while ((sign = isDiscriminative(palette.slice(0, palette.length / 2))) > 0) {
            count += 1;
            if (count === 100) break;
            rgb = d3.rgb(palette[sign])
            color = d3.rgb(norm255(rgb.r + getRandomIntInclusive(-disturb_step, disturb_step)), norm255(rgb.g + getRandomIntInclusive(-disturb_step, disturb_step)), norm255(rgb.b + getRandomIntInclusive(-disturb_step, disturb_step)))
            // while (getColorName(color) === disliked_color_name) {
            //     color = d3.rgb(norm255(rgb.r + getRandomIntInclusive(-disturb_step, disturb_step)), norm255(rgb.g + getRandomIntInclusive(-disturb_step, disturb_step)), norm255(rgb.b + getRandomIntInclusive(-disturb_step, disturb_step)))
            // }
            hcl = rgb2hcl(color);
            if (hcl.h >= 85 && hcl.h <= 114 && hcl.l >= 35 && hcl.l <= 75) {
                if (Math.abs(hcl.h - 85) > Math.abs(hcl.h - 114)) {
                    hcl.h = 115;
                } else {
                    hcl.h = 84;
                }
            }
            palette[sign] = hcl2rgb(d3.hcl(normScope(hcl.h, colors_scope.hue_scope), normScope(hcl.c, [0, 100]), normScope(hcl.l, colors_scope.lumi_scope)));
            color = palette[sign]
            color1 = traditionalColorBlending([color.r, color.g, color.b, opacity], [background_color.r, background_color.g, background_color.b, 1])
            palette[sign + palette.length / 2] = d3.rgb(color1[0], color1[1], color1[2])
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

/**
 * @param {} palette 
 * @param {*} colors_scope 
 */
function disturbColorsOpacity(palette, colors_scope, prob, opacity) {

    let class_number = palette.length / 2

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
        randomDisturbColorsOpacity(palette, opacity, colors_scope);
    }

    let background_color = d3.rgb(bgcolor)
    // disturb the opacity
    if (Math.random() < 1) {
        // find a new baseline opacity
        let sign = true, count = 0
        while (sign) {
            sign = false;
            opacity = opacity + getRandomIntInclusive((opacity - 0.1 < 0) ? (-opacity * 100) : (-10), (opacity + 0.1 > 1) ? ((1 - opacity) * 100) : 10) * 0.01
            for (let i = 0; i < class_number; i++) {
                let color = d3.rgb(palette[i])
                let color1 = traditionalColorBlending([color.r, color.g, color.b, opacity], [background_color.r, background_color.g, background_color.b, 1])
                // console.log(d3.hsl(color), d3.hsl(d3.rgb(color1[0], color1[1], color1[2])));
                palette[i + class_number] = d3.rgb(color1[0], color1[1], color1[2])
                if (d3_ciede2000(d3.lab(palette[i]), d3.lab(bgcolor)) < d3_ciede2000(d3.lab(palette[i + class_number]), d3.lab(bgcolor))) {
                    sign = true;
                    break
                }
            }
            count += 1
            if (count > 100) break;
        }
    } else {
        // disturb the opacity of a random color in a range [-0.05, 0.05]
        let sign = true, count = 0
        let idx = getRandomIntInclusive(0, class_number - 1)
        while (sign) {
            sign = false;
            let l = opacity + getRandomIntInclusive(-5, 5) * 0.01
            palette[idx + class_number] = d3.hsl(palette[idx + class_number].h, palette[idx + class_number].s, l)
            let to_bg = d3_ciede2000(d3.lab(palette[idx + class_number]), d3.lab(bgcolor))
            if (to_bg < 5 || d3_ciede2000(d3.lab(palette[idx]), d3.lab(bgcolor)) < to_bg) {
                sign = true;
                break
            }
            count += 1
            if (count > 100) break;
        }
    }

    return opacity

}
function simulatedAnnealingOpacity(palette_size, colors_scope = { "hue_scope": [0, 360], "lumi_scope": [35, 85] }) {
    let iterate_times = 0;
    //default parameters
    let max_temper = 100000,
        dec = decline_rate,
        max_iteration_times = 10000000,
        end_temper = 0.001;
    cur_temper = max_temper;
    //generate a totally random palette
    let color_palette = getColorPaletteRandom(palette_size);
    let tmp_L = Math.random()
    let background_color = d3.rgb(bgcolor)
    for (let i = 0; i < palette_size; i++) {
        let color = d3.rgb(color_palette[i])
        let color1 = traditionalColorBlending([color.r, color.g, color.b, tmp_L], [background_color.r, background_color.g, background_color.b, 1])
        color_palette[i + palette_size] = d3.rgb(color1[0], color1[1], color1[2])
    }
    //evaluate the default palette
    let o = {
        id: color_palette,
        lightness: tmp_L,
        score: getPaletteScore(color_palette)
    },
        preferredObj = o;
    color_names_checked = collectColorNames();

    let delta_score = 0
    while (cur_temper > end_temper) {
        for (let i = 0; i < 1; i++) { //disturb at each temperature
            iterate_times++;
            color_palette = o.id.slice();
            let lightness = o.lightness
            lightness = disturbColorsOpacity(color_palette, colors_scope, Math.exp((-delta_score - 0.1) / cur_temper), lightness);
            let color_palette_2 = color_palette.slice();
            let o2 = {
                id: color_palette_2,
                lightness: lightness,
                score: getPaletteScore(color_palette_2)
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