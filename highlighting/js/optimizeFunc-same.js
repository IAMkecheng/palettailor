/**
 * same lightness
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
                blank_pos.push(id)
            }
            id++;
        });

    let best_color;
    if (blank_pos.length === 0 || blank_pos.length === class_number) {
        best_color = simulatedAnnealing2FindBestPalette(class_number, colors_scope);
        while (best_color.score === -10000000) {
            best_color = simulatedAnnealing2FindBestPalette(class_number, colors_scope);
            console.log("re-do", best_color.score);
        }
    }
    else {
        best_color = completePalette(origin_palette, blank_pos, colors_scope);
    }

    console.log("=======================================================");
    console.log("final score = ", best_color.score);
    getPaletteScore(best_color.id, true)
    // if already have a svg, then insert it to the history
    addToHistory();

    let used_palette = best_color.id.slice()
    let used_palette_0 = best_color.id.slice()
    let used_palette_1 = best_color.id.slice()
    let l = d3.hsl(best_color.id[class_number]).l
    console.log("final lightness = ", l);
    for (let i = 0; i < class_number; i++) {
        let hsl = d3.hsl(used_palette[i])
        used_palette[i + class_number] = d3.hsl(hsl.h, hsl.s, l)
        used_palette_0[i + class_number] = used_palette_0[i];
        used_palette_1[i] = used_palette_1[i + class_number] = d3.hsl(hsl.h, hsl.s, l)
    }

    if (DATATYPE === "SCATTERPLOT") {
        appendScatterplot(used_palette_0)
        appendScatterplot(used_palette_1)
    }

    //bar chart
    if (DATATYPE === "BARCHART") {
        appendBarchart(used_palette_0)
        appendBarchart(used_palette_1)
    }

    //line chart
    if (DATATYPE === "LINECHART") {
        appendLinechart(used_palette_0)
        appendLinechart(used_palette_1)
    }

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
        bg_contrast_array[i] = d3_ciede2000(d3.lab(palette[i]), d3.lab(d3.rgb(bgcolor))) - d3_ciede2000(d3.lab(d3.rgb(palette2[i])), d3.lab(d3.rgb(d3.rgb(bgcolor))))
        if (bg_contrast_array[i] < 10) return -10000000
        for (let j = i + 1; j < class_number; j++) {
            let cd_0 = d3_ciede2000(d3.lab(palette[i]), d3.lab(palette[j])),
                cd_1 = d3_ciede2000(d3.lab(d3.rgb(palette2[i])), d3.lab(d3.rgb(palette2[j])))
            // if (cd_0 < 10 || cd_1 < 5) return -10000000
            min_cd = min_cd > cd_0 ? cd_0 : min_cd
            min_cd = min_cd > cd_1 ? cd_1 : min_cd
            color_dis[i][j] = color_dis[j][i] = (cd_0 + cd_1)
            let nd_0 = getNameDifference(palette[i], palette[j]),
                nd_1 = getNameDifference(palette2[i], palette2[j])
            // if (nd_0 < 0.1 || nd_1 < 0.1) return -10000000
            min_nd = min_nd > nd_0 ? nd_0 : min_nd
            min_nd = min_nd > nd_1 ? nd_1 : min_nd
            name_difference += nd_0 + nd_1;
        }
        let nc = getNameDifference(palette[i], palette2[i]);
        // name_consistency = (name_consistency < nc) ? nc : name_consistency
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

    let palette_score = score_importance_weight[0] * local_contrast + score_importance_weight[1] * background_contrast + score_importance_weight[2] * name_difference - score_importance_weight[3] * name_consistency + min_cd * 0.1
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
    for (let i = 0; i < palette_size; i++) {
        let hsl = d3.hsl(color_palette[i])
        color_palette[i + palette_size] = d3.hsl(hsl.h, hsl.s, 0.9)
    }
    //evaluate the default palette
    // updateCurrBestScore(color_palette)
    let o = {
        id: color_palette,
        score: getPaletteScore(color_palette)
    },
        preferredObj = o;
    // console.log("initial score = ", o.score);
    color_names_checked = collectColorNames();
    let dscores = [], delta_scores = []
    while (cur_temper > end_temper) {
        for (let i = 0; i < 1; i++) { //disturb at each temperature
            iterate_times++;
            color_palette = o.id.slice();
            disturbColors(color_palette, colors_scope);
            let color_palette_2 = color_palette.slice();
            let o2 = {
                id: color_palette_2,
                score: getPaletteScore(color_palette_2)
            };
            // while (o2.score < 0) {
            //     disturbColors(color_palette, colors_scope);
            //     color_palette_2 = color_palette.slice();
            //     o2 = {
            //         id: color_palette_2,
            //         score: getPaletteScore(color_palette_2)
            //     };
            // }

            let delta_score = o.score - o2.score;
            let prob = Math.exp((-delta_score - 0.1) / cur_temper)
            delta_scores.push([iterate_times, delta_score > 10 ? 10 : delta_score])
            if (delta_score > 0)
                dscores.push([iterate_times, prob > 1 ? 1 : prob])
            if (delta_score <= 0 || delta_score > 0 && Math.random() <= prob) {
                o = o2;
                if (preferredObj.score - o.score < 0) {
                    preferredObj = o;
                    // updateCurrBestScore(preferredObj.id)
                }
            }
            if (iterate_times > max_iteration_times) {
                break;
            }
        }

        cur_temper *= dec;
    }
    showTrend(dscores)
    showTrend(delta_scores)

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
    let count = 0,
        sign;
    while (true) {
        while ((sign = isDiscriminative(palette)) >= 0) {
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
            // color_dis = d3_ciede2000(d3.lab(palette[i + class_number]), d3.lab(palette[j + class_number]));
            // if (color_dis < 10) {
            //     return j;
            // }

            // let name_difference = getNameDifference(palette[i], palette[j])
            // if (name_difference < 0.1) {
            //     return j;
            // }
            // name_difference = getNameDifference(palette[i + class_number], palette[j + class_number])
            // if (name_difference < 0.1) {
            //     return j;
            // }
        }
        // if (d3_ciede2000(d3.lab(palette[i]), d3.lab(bgcolor)) < 10) {
        //     return i;
        // }
    }
    return -1;
}

/**
 * @param {} palette 
 * @param {*} colors_scope 
 */
function disturbColors(palette, colors_scope) {

    if (Math.random() < 0.5) {
        randomDisturbColors(palette, colors_scope);
    } else {
        // disturb the lightness
        let class_number = palette.length / 2, sign = true, count = 0
        let l0 = d3.hsl(palette[class_number]).l
        while (sign) {
            sign = false;
            // let l = 0.5 + getRandomIntInclusive(-50, 50) * 0.01
            // let l = l0 + getRandomIntInclusive(-l0 * 100, (1 - l0) * 100) * 0.01
            let l = l0 + getRandomIntInclusive((l0 - 0.1 < 0) ? (-l0 * 100) : (-10), (l0 + 0.1 > 1) ? ((1 - l0) * 100) : 10) * 0.01
            for (let i = 0; i < class_number; i++) {
                let hsl = d3.hsl(palette[i])
                palette[i + class_number] = d3.rgb(d3.hsl(hsl.h, hsl.s, l))
                if (d3_ciede2000(d3.lab(palette[i]), d3.lab(bgcolor)) < d3_ciede2000(d3.lab(palette[i + class_number]), d3.lab(bgcolor))) {
                    sign = true;
                    break
                }
            }
            count += 1
            if (count > 100) break;
        }

    }
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
    for (let i = 0; i < origin_palette.length; i++) {
        let hsl = d3.hsl(color_palette[i])
        color_palette[i + origin_palette.length] = d3.hsl(hsl.h, hsl.s, 0.9)
    }
    criterion_cd = -1.0;
    //evaluate the default palette
    let o = {
        id: color_palette,
        score: getPaletteScore(color_palette)
    },
        preferredObj = o;

    color_names_checked = collectColorNames();
    while (cur_temper > end_temper) {
        for (let i = 0; i < 1; i++) {//disturb at each temperature
            iterate_times++;


            if (Math.random() < 0.5) {
                color_palette = completePaletteRandom(o.id, blank_pos, colors_scope);
            } else {
                // disturb the lightness
                let class_number = origin_palette.length, sign = true, count = 0
                color_palette = o.id.slice()
                while (sign) {
                    sign = false;
                    let l = 0.5 + getRandomIntInclusive(-50, 50) * 0.01
                    for (let i = 0; i < class_number; i++) {
                        let hsl = d3.hsl(color_palette[i])
                        color_palette[i + class_number] = d3.rgb(d3.hsl(hsl.h, hsl.s, l))
                        let nd = getNameDifference(color_palette[i], color_palette[i + class_number])
                        if (nd > 0.8) {
                            sign = true;
                            break
                        }
                    }
                    count += 1
                    if (count > 100) break;
                }

            }

            let o2 = {
                id: color_palette,
                score: getPaletteScore(color_palette)
            };

            let delta_score = o.score - o2.score;
            if (delta_score <= 0 || delta_score > 0 && Math.random() <= Math.exp((-delta_score) / cur_temper)) {
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
    if (start)
        for (let i = 0; i < pos.length; i++) {
            let rgb = d3.rgb(getRandomIntInclusive(0, 255), getRandomIntInclusive(0, 255), getRandomIntInclusive(0, 255));
            palette[pos[i]] = rgb;
        }
    else {
        if (Math.random() <= 1) {
            let pos_colors = [], fixed_colors = [];
            for (let i = 0; i < palette.length; i++) {
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
                    pos_colors[sign[1]] = palette[sign[0]];
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
        } else {
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