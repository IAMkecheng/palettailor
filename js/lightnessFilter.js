var lightnessFilterBar = d3.select('#lightnessFilterBar').attr("width", 180).attr("height", 50);

(function() {
  var m_width = +lightnessFilterBar.style('width').replace('px', ''),
    m_height = +lightnessFilterBar.style('height').replace('px', ''),
    m_margin = {
      bottom: 0,
      left: 5,
      right: 5,
      top: 0
    };

  var lightnessFilterBar_group = lightnessFilterBar.append('g')
    .attr('transform', 'translate(' + m_margin.left + ',' + m_margin.top + ')');

  m_width = m_width - m_margin.left - m_margin.right;
  m_height = m_height - m_margin.top - m_margin.bottom;

  var stripes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100],
    stripeW = m_width / stripes.length;

  var stripeX = d3.scaleLinear()
    .domain(d3.extent(stripes))
    .range([0, m_width - stripeW]),
    reverseStripeX = d3.scaleLinear()
    .domain([0, m_width - stripeW])
    .range(d3.extent(stripes));

  var gradient = lightnessFilterBar_group.append('g').selectAll('rect')
    .data(stripes).enter()
    .append('rect')
    .style('fill', function(d) {
      return d3.lab(d, 0, 0);
    })
    .attr('x', function(d) {
      return stripeX(d);
    })
    .attr('y', m_height / 3)
    .attr('width', function(d, i) {
      return stripeW + (i < stripes.length - 1 ? 1 : 0);
    })
    .attr('height', 2 * m_height / 3);

  let lightness_high = 95,
    lightness_low = 45;

  var dragExtent = lightnessFilterBar_group.append('rect')
    .attr("x", stripeX(lightness_low))
    .attr("y", m_height / 3 - 2)
    .attr("width", stripeX(lightness_high + 5) - stripeX(lightness_low))
    .attr("height", 4)
    .attr("fill", 'rgba(0,0,0,0.75)')
    .attr("stroke", 'rgba(100,100,100,0.5)');

  var lowerDrag = lightnessFilterBar_group.append('circle')
    .attr("cx", stripeX(lightness_low))
    .attr("cy", m_height / 3)
    .attr("r", 6)
    .attr("fill", '#000')
    .attr("stroke", '#fff');

  var upperDrag = lightnessFilterBar_group.append('circle')
    .attr("cx", stripeX(lightness_high + 5))
    .attr("cy", m_height / 3)
    .attr("r", 6)
    .attr("fill", '#fff')
    .attr("stroke", '#000');

  function draggedLower(d) {
    var x = Math.floor(d3.event.x / stripeW) * stripeW +
      (d3.event.x % stripeW < 0.5 * stripeW ? 0 : stripeW);
    if (x < 0) x = 0;
    if (x > +upperDrag.attr('cx') - stripeW) x = +upperDrag.attr('cx') - stripeW;
    d3.select(this).attr('cx', x);
    dragExtent.attr('x', x).attr('width', +upperDrag.attr('cx') - x);
    d3.select('#lightnessFilterRangeLow')
      .property('value', Math.round(reverseStripeX(x)));
  }

  function draggedUpper(d) {
    var x = Math.floor(d3.event.x / stripeW) * stripeW +
      (d3.event.x % stripeW < 0.5 * stripeW ? 0 : stripeW);
    if (x < +lowerDrag.attr('cx') + stripeW) x = +lowerDrag.attr('cx') + stripeW;
    if (x > m_width) x = m_width;
    d3.select(this).attr('cx', x);
    dragExtent.attr('width', x - lowerDrag.attr('cx'));
    d3.select('#lightnessFilterRangeHigh')
      .property('value', Math.round(reverseStripeX(x) - 5));
  }

  lowerDrag.call(d3.drag().on("drag", draggedLower).on("end", function() {
    // prepareKnnTreeColors(hue_range_global_1);
    // prepareColors(hue_range_global_1);
  }));
  upperDrag.call(d3.drag().on("drag", draggedUpper).on("end", function() {
    // prepareKnnTreeColors(hue_range_global_1);
    // prepareColors(hue_range_global_1);
  }));

  d3.select('#lightnessFilterRangeLow')
    .property('value', lightness_low);
  d3.select('#lightnessFilterRangeHigh')
    .property('value', lightness_high);
})();
