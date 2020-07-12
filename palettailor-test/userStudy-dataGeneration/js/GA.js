class GA {
  constructor(r, labelNum, comp, E, selectionScoreFunc, iterationTimes = 3000) {
    if (labelNum < 2)
      throw "Don't need to do assignment."
    this.rand = r;
    this.labelNum = labelNum;
    this.selectionScoreFunc = selectionScoreFunc;
    this.comp = comp;
    this.scoreFunc = E;

    this.crossoverRate = 0.7;
    this.mutationRate = 0.05;
    this.lifeNum = 10;
    this.iterationTimes = iterationTimes;
    this.totalPopulation = [];
  }

  select(population) {
    var newPopulation = new Array(this.lifeNum - 1);
    var sumFitness = d3.sum(population, (x) => this.selectionScoreFunc(x.score));
    for (var i = 0; i < newPopulation.length; i++) {
      var random = this.rand.random(),
        fits = 0,
        j = 0;
      for (; j < population.length; j++) {
        fits += this.selectionScoreFunc(population[j].score) / sumFitness;
        if (fits >= random || Number.isNaN(fits))
          break;
      }
      newPopulation[i] = deepCopy(population[j]);
    }
    newPopulation.push(deepCopy(population.reduce((x, y) => this.comp(x.score, y.score) > 0 ? x : y))); // add best assignment
    return newPopulation;
  }

  crossOver(population) {
    function crossFunc(r, sigma1, sigma2) {
      var i1 = r.randInt(sigma1.length - 2),
        i2 = r.randInt(sigma1.length - i1) + i1;
      var tmpSigma1 = sigma2.slice(i1, i2),
        tmpSigma2 = sigma1.slice(i1, i2);
      var filteredSimga1 = sigma1.filter(x => !tmpSigma1.includes(x)),
        filteredSimga2 = sigma2.filter(x => !tmpSigma2.includes(x));
      tmpSigma1 = filteredSimga1.slice(0, i1).concat(tmpSigma1).concat(filteredSimga1.slice(i1));
      tmpSigma2 = filteredSimga2.slice(0, i1).concat(tmpSigma2).concat(filteredSimga2.slice(i1));
      return [tmpSigma1, tmpSigma2];
    }
    for (var i = 0; i < population.length - 1; i++) {
      if (this.rand.random() < this.crossoverRate) {
        var j = this.rand.randInt(population.length - 1),
          [tmpSigma1, tmpSigma2] = crossFunc(this.rand, population[i].sigma, population[j].sigma),
          tmpObj1 = {
            sigma: tmpSigma1,
            score: this.scoreFunc(tmpSigma1)
          },
          tmpObj2 = {
            sigma: tmpSigma2,
            score: this.scoreFunc(tmpSigma2)
          };
        if (this.comp(tmpObj1.score, population[population.length - 1].score) > 0) {
          population[i] = population[population.length - 1];
          population[population.length - 1] = tmpObj1;
        }
        if (this.comp(tmpObj2.score, population[population.length - 1].score) > 0) {
          population[j] = population[population.length - 1];
          population[population.length - 1] = tmpObj2;
        }
        this.totalPopulation.push(tmpObj1);
        this.totalPopulation.push(tmpObj2);
      }
    }
  }

  mutate(population) {
    for (var i = 0; i < population.length - 1; i++) {
      if (this.rand.random() < this.mutationRate) {
        var first = this.rand.randInt(this.labelNum),
          second = this.rand.randInt(this.labelNum);
        swap(population[i].sigma, first, second);
        population[i].score = this.scoreFunc(population[i].sigma);
        this.totalPopulation.push(population[i]);
        if (this.comp(population[i].score, population[population.length - 1].score) > 0) {
          swap(population, i, population.length - 1);
        }
      }
    }
  }

  initPopulation() {
    var origin = [...Array(this.labelNum).keys()];
    var population = [];
    for (var i = 0; i < this.lifeNum; i++) {
      var sigma = this.rand.shuffle([...origin]),
        score = this.scoreFunc(sigma);
      population.push({
        sigma: sigma,
        score: score
      });
      this.totalPopulation.push({
        sigma: sigma,
        score: score
      });
    }
    return population;
  }

  compute() {
    var population = this.initPopulation();
    for (var k = 0; k < this.iterationTimes; k++) {
      population = this.select(population);
      this.crossOver(population);
      this.mutate(population);
    }
    console.log("population:",population)
    return population[population.length - 1];
  }

  getTotalPopulation() {
    let tmp = this.totalPopulation.sort(function (a, b) { return a.score - b.score; })
    return tmp;
  }

}

class Random {

  constructor(s) {
    s = s ? s : 123456789;
    this.seed(s);
    this.mask = 0xffffffff;
  }

  // Takes any integer
  seed(i) {
    this.m_w = i;
    this.m_z = 987654321;
  }

  // Returns number between 0 (inclusive) and 1.0 (exclusive),
  // just like Math.random().
  random() {
    this.m_z = (36969 * (this.m_z & 65535) + (this.m_z >> 16)) & this.mask;
    this.m_w = (18000 * (this.m_w & 65535) + (this.m_w >> 16)) & this.mask;
    var result = ((this.m_z << 16) + this.m_w) & this.mask;
    result /= 4294967296;
    return result + 0.5;
  }

  randInt(rngMax) {
    return Math.floor(this.random() * rngMax);
  }

  shuffle(arr) {
    let i = arr.length;
    while (i) {
      let j = Math.floor(this.random() * i--);
      [arr[j], arr[i]] = [arr[i], arr[j]];
    }

    return arr;
  }
}

function deepCopy(o) {
  return $.extend(true, {}, o);
}
function swap(a, i, j) {
  var tmp = a[i];
  a[i] = a[j];
  a[j] = tmp;
}
