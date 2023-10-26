/**
 * given a palette, return the assignment result and highlighted version
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
    console.log("final lightness = ", best_color.lightness);
    console.log("final score = ", best_color.score);
    getPaletteScore(best_color.id, true)
    // if already have a svg, then insert it to the history
    addToHistory();

    // used_palette = ["#a96a8d","#d8c300","#646d68","#c42f58","#7b6659","#297a29","#2257ff","#814ad8","#287eea","#b9ff49","#d8bbcb","#fff69e","#d7dad9","#f0c1ce","#dfd7d3","#a7e1a7","#a8bdff","#bfa3eb","#bed8f9","#e2ffb2"]
    // // used_palette = ["#63899e", "#ba6b8f", "#e74c5e", "#a659ff", "#f7c56f", "#a59b6d", "#9f7a7d", "#4fd129", "#397cff", "#eb23c6", "#cfdbe1", "#eedce4", "#f9d6da", "#e0c6ff", "#fcefd8", "#f1efe8", "#ede7e7", "#cef3c3", "#dbe7ff", "#fcdef6"]
    // let l = 0.8
    // for (let i = used_palette.length / 2; i < used_palette.length; i++) {
    //     let hsl = d3.hsl(used_palette[i])
    //     used_palette[i] = d3.hsl(hsl.h, hsl.s, l)
    // }

    let used_palette = best_color.id.slice()
    let used_palette_0 = used_palette.slice()
    let used_palette_1 = used_palette.slice()
    for (let i = 0; i < class_number; i++) {
        used_palette_0[i + class_number] = used_palette_0[i];
        used_palette_1[i] = used_palette_1[i + class_number]
    }



    if (DATATYPE === "SCATTERPLOT") {
        appendScatterplot(used_palette_0)
        appendScatterplot(used_palette_1)
        // let used_palette_2 = used_palette.slice()
        // for (let i = 0; i < class_number; i++) {
        //     used_palette_2[i + class_number] = d3.rgb(200, 200, 200);
        // }
        // appendScatterplot(used_palette_2)
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
    for (let i = 0; i < class_number; i++) {
        color_dis[i] = new Array(class_number)
    }
    let bg_contrast_array = new Array(class_number)
    let name_difference = 0, name_consistency = -100000, color_discrimination = [100000, 100000]
    for (let i = 0; i < class_number; i++) {
        bg_contrast_array[i] = d3_ciede2000(d3.lab(palette[i]), d3.lab(d3.rgb(bgcolor))) - d3_ciede2000(d3.lab(d3.rgb(palette2[i])), d3.lab(d3.rgb(d3.rgb(bgcolor))))
        // bg_contrast_array[i] = 100 - d3.lab(palette[i]).L - 100 + d3.lab(palette2[i]).L
        for (let j = i + 1; j < class_number; j++) {
            let cd_0 = d3_ciede2000(d3.lab(palette[i]), d3.lab(palette[j])), cd_1 = d3_ciede2000(d3.lab(d3.rgb(palette2[i])), d3.lab(d3.rgb(palette2[j])))
            color_dis[i][j] = color_dis[j][i] = (cd_0 + cd_1)
            name_difference += getNameDifference(palette[i], palette[j]);
            name_difference += getNameDifference(palette2[i], palette2[j]);
            color_discrimination[0] = (color_discrimination[0] > cd_0) ? cd_0 : color_discrimination[0]
            color_discrimination[1] = (color_discrimination[1] > cd_1) ? cd_1 : color_discrimination[1]
        }
        let nc = getNameDifference(palette[i], palette2[i]);
        name_consistency = (name_consistency < nc) ? nc : name_consistency
    }
    // if (sign) console.log("bg_contrast_array ", bg_contrast_array, d3.sum(bg_contrast_array), palette2);

    if (color_discrimination[0] < 10) return -10000000
    if (color_discrimination[1] < 5) return -10000000

    let tmp_pd = new Array(class_number).fill(0),
        tmp_cb = new Array(class_number).fill(0);
    for (let i = 0; i < class_number; i++) {
        for (let j = 0; j < class_number; j++) {
            if (i === j) continue;
            tmp_pd[i] += alphaShape_distance[i][j] * (color_dis[i][j]);
        }
        tmp_cb[i] += non_separability_weights[i] * (bg_contrast_array[i])
    }

    let local_contrast = getBaseLog(100, 1 + d3.mean(tmp_pd))
    let cb_mean = d3.mean(tmp_cb)
    let background_contrast = cb_mean / Math.abs(cb_mean) * getBaseLog(100, 1 + Math.abs(cb_mean))
    name_difference /= class_number * (class_number - 1);
    // name_consistency /= class_number
    // if (sign)
    //     console.log(d3.mean(tmp_pd), d3.mean(tmp_cb));
    let palette_score = score_importance_weight[0] * local_contrast + score_importance_weight[1] * background_contrast * 5 + score_importance_weight[2] * name_difference - score_importance_weight[3] * name_consistency
    // console.log(local_contrast, background_contrast, name_difference, name_consistency, palette_score);
    if (sign)
        console.log(local_contrast, background_contrast, name_difference, name_consistency, palette_score);
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
    let color_palette = Tableau_10_palette.slice(0, palette_size)
    for (let i = 0; i < palette_size; i++) {
        let hsl = d3.hsl(color_palette[i])
        color_palette[i + palette_size] = d3.hsl(hsl.h, hsl.s, 0.9)
    }
    score_recording = []
    //evaluate the default palette
    // updateCurrBestScore(color_palette)
    let o = {
        id: color_palette,
        lightness: 0.9,
        score: getPaletteScore(color_palette)
    },
        preferredObj = o;
    // console.log("initial score = ", o.score);
    color_names_checked = collectColorNames();
    let delta_score = 0;
    while (cur_temper > end_temper) {
        for (let i = 0; i < 1; i++) { //disturb at each temperature
            iterate_times++;
            color_palette = o.id.slice();
            lightness = o.lightness
            lightness = disturbColors(color_palette, colors_scope, Math.exp((-delta_score) * 10 / cur_temper), lightness);
            let color_palette_2 = color_palette.slice();
            let o2 = {
                id: color_palette_2,
                lightness: lightness,
                score: getPaletteScore(color_palette_2)
            };

            delta_score = o.score - o2.score;
            if (delta_score <= 0 || delta_score > 0 && Math.random() <= Math.exp((-delta_score) * 10 / cur_temper)) {
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

function removeDislikedColorName(color) {
    let disliked_color_name = "grey"
    while (getColorName(color) === disliked_color_name) {

    }

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
            color_dis = d3_ciede2000(d3.lab(d3.rgb(palette[i + class_number])), d3.lab(d3.rgb(palette[j + class_number])));
            if (color_dis < 10) {
                return j;
            }
        }
        // if (d3_ciede2000(d3.lab(palette[i + class_number]), d3.lab(bgcolor)) < 10) {
        //     return i;
        // }
    }
    return -1;
}

/**
 * @param {} palette 
 * @param {*} colors_scope 
 */
function disturbColors(palette, colors_scope, prob, lightness) {

    let class_number = palette.length / 2
    if (Math.random() < prob) {
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
    }


    // disturb the lightness
    if (Math.random() < prob) {
        // find a new baseline lightness
        let sign = true, count = 0
        while (sign) {
            sign = false;
            lightness = lightness + getRandomIntInclusive(-lightness * 100, (1 - lightness) * 100) * 0.01
            for (let i = 0; i < class_number; i++) {
                let hsl = d3.hsl(palette[i])
                palette[i + class_number] = d3.hsl(hsl.h, hsl.s, lightness)
                let nd = getNameDifference(palette[i], palette[i + class_number])
                if (nd > 0.8) {
                    sign = true;
                }
                // if (d3_ciede2000(d3.lab(palette[i + class_number]), d3.lab(d3.rgb(bgcolor))) < 10) {
                //     sign = true;
                //     break
                // }
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
            let nd = getNameDifference(palette[idx], palette[idx + class_number])
            if (nd > 0.8) {
                sign = true;
            }
            // if (d3_ciede2000(d3.lab(palette[idx + class_number]), d3.lab(d3.rgb(bgcolor))) < 10) {
            //     sign = true;
            // }
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