document.addEventListener("DOMContentLoaded", async () => {
    const margin = { top: 70, right: 200, bottom: 40, left: 80 };
    const width = 1600 - margin.left - margin.right;
    const height = 700 - margin.top - margin.bottom;
  
    const x = d3.scaleTime().range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);
    const xAnnotations = d3.scaleLinear().range([0, width]);
  
    const svg = d3
      .select("#chart-container")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
  
    const data = await d3.csv("EPL Standings 2000-2022.csv", d => ({
      ...d,
      Season: d3.timeParse("%Y")(d.Season.substring(0, 4)),
      Pos: +d.Pos
    }));
  
    const teams = Array.from(d3.group(data, d => d.Team), ([key, value]) => ({ key, values: value }));
  
    const isSpecificTeam = team => ["Arsenal", "Manchester United", "Chelsea", "Liverpool", "Tottenham Hotspur", "Manchester City"].includes(team);
  
    const customColors = {
      "Arsenal": "#EF0107",
      "Manchester United": "#DA291C",
      "Chelsea": "#034694",
      "Liverpool": "#C8102E",
      "Tottenham Hotspur": "#132257",
      "Manchester City": "#6CABDD",
    };
  
    const defaultColor = "#BDBDBD";
    const colorScale = d3.scaleOrdinal()
      .domain(teams.map(team => team.key))
      .range(teams.map(team => customColors[team.key] || defaultColor));
  
    x.domain(d3.extent(data, d => d.Season));
    y.domain([20, 1]);
    xAnnotations.domain([2000, 2022]);
  
    const customTickFormat = (date) => {
      const startYear = d3.timeFormat("%Y")(date);
      const endYear = d3.timeFormat("%Y")(d3.timeYear.offset(date, 1));
      return `${startYear}-${endYear}`;
    };
  
    const line = d3.line()
      .x(d => x(d.Season))
      .y(d => y(d.Pos));
  
    svg.select(".x-axis").remove();
  
    svg.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height})`)
      .style("font-size", "16px")
      .call(d3.axisBottom(x)
        .ticks(d3.timeYear.every(5))
        .tickFormat(customTickFormat)
        .tickSize(0))
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick line").remove());
  
    svg.append("g")
      .style("font-size", "12px")
      .call(d3.axisLeft(y)
        .tickValues(d3.range(1, 21))
        .tickFormat(d => {
          if (d === 20) return "";
          const suffixes = ["st", "nd", "rd", "th"];
          const suffixIndex = (d % 10 > 0 && d % 10 <= 3 && Math.floor(d / 10) !== 1) ? (d % 10 - 1) : 3;
          return `${d}${suffixes[suffixIndex]}`;
        })
        .tickSize(0)
        .tickPadding(10))
      .call(g => g.select(".domain").remove());
  
    svg.selectAll(".xGrid")
      .data(x.ticks().slice(1))
      .join("line")
      .attr("class", "xGrid")
      .attr("x1", d => x(d))
      .attr("x2", d => x(d))
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", "#e0e0e0")
      .attr("stroke-width", 0.5);
  
    const teamPseudonyms = {
      "Arsenal": "ARS",
      "Manchester United": "MNU",
      "Chelsea": "CHE",
      "Liverpool": "LIV",
      "Tottenham Hotspur": "TOT",
      "Manchester City": "MCI",
    };
  
    const annotationsData = [
      { year: 2010, text: "Start of Big-6 reign" },
      { year: 2015, text: "First time a non Big-6 wins the league" },
      { year: 2021, text: "Big-6 largely keep hold of the top spots still" },
    ];
  
    function updateAnnotations(year) {
      const annotationsToShow = annotationsData.filter(annotation => d3.timeParse("%Y")(annotation.year) <= year);
  
      const annotationGroup = svg.selectAll(".annotation-group")
        .data(annotationsToShow, d => d.year);
  
      const enteringAnnotations = annotationGroup.enter().append("g")
        .attr("class", "annotation-group")
        .attr("transform", d => `translate(${xAnnotations(d.year)}, 0)`);
  
      enteringAnnotations.append("line")
        .attr("class", "annotation-line")
        .attr("x1", 0)
        .attr("x2", 0)
        .attr("y1", 0)
        .attr("y2", height)
        .style("stroke", "#888")
        .style("stroke-dasharray", "2,2")
        .style("pointer-events", "none");
  
      enteringAnnotations.append("text")
        .attr("class", "annotation-text")
        .attr("x", 4)
        .attr("y", 0)
        .attr("dy", "-1.5em")
        .style("fill", "#888")
        .style("font-size", "12px")
        .text(d => d.text);
  
      annotationGroup.exit().remove();
  
      annotationGroup.merge(enteringAnnotations)
        .attr("transform", d => `translate(${xAnnotations(d.year)}, 0)`);
    }
  
  
    function updateChart(year) {
      x.domain([d3.min(data, d => d.Season), year]);
  
      svg.select(".x-axis").remove();
  
      svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`)
        .style("font-size", "16px")
        .call(d3.axisBottom(x)
          .ticks(d3.timeYear.every(5))
          .tickFormat(customTickFormat)
          .tickSize(0)
          .tickSizeOuter(0))
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick line").remove());
  
      const teamPseudonymLabels = svg.selectAll(".team-pseudonym")
        .data(teams.filter(d => isSpecificTeam(d.key)), d => d.key);
  
      teamPseudonymLabels
        .attr("x", d => x(d.values.filter(d => d.Season <= year)[0].Season) + 3)
        .attr("y", d => y(d.values.filter(d => d.Season <= year)[0].Pos))
        .text(d => teamPseudonyms[d.key]);
  
      teamPseudonymLabels.enter()
        .append("text")
        .attr("class", "team-pseudonym")
        .attr("x", d => x(d.values.filter(d => d.Season <= year)[0].Season) + 3)
        .attr("y", d => y(d.values.filter(d => d.Season <= year)[0].Pos))
        .text(d => teamPseudonyms[d.key])
        .style("font-size", "12px")
        .style("fill", d => colorScale(d.key))
        .style("font-family", "sans-serif")
        .style("alignment-baseline", "middle")
        .style("text-anchor", "start");
  
      teamPseudonymLabels.exit().remove();
  
      const teamLines = svg.selectAll(".team-line")
        .data(teams);
  
      teamLines.enter()
        .append("path")
        .attr("class", "team-line")
        .attr("fill", "none")
        .attr("stroke-width", d => isSpecificTeam(d.key) ? 3.5 : 2)
        .attr("stroke-opacity", d => isSpecificTeam(d.key) ? 1 : 0.6)
        .attr("d", d => line(d.values.filter(d => d.Season <= year)))
        .attr("stroke", d => colorScale(d.key))
        .attr("stroke-dasharray", function (d) {
          const length = this.getTotalLength();
          return length + " " + length;
        })
        .attr("stroke-dashoffset", function () {
          return this.getTotalLength();
        })
        .transition()
        .duration(500)
        .attr("stroke-dashoffset", 0);
  
      teamLines
        .transition()
        .duration(500)
        .attr("d", d => line(d.values.filter(d => d.Season <= year)));
  
      teamLines.exit().remove();
  
      updateAnnotations(year);
    }
  
    updateChart(d3.timeParse("%Y")("2000"));
  
    const slider = d3.select("#slider");
    const yearLabel = d3.select("#year-label");
  
    const defaultYear = "2022";
    slider.property("value", defaultYear);
    yearLabel.text(defaultYear);
  
    slider.on("input", function () {
      const year = this.value;
      yearLabel.text(year);
      updateChart(d3.timeParse("%Y")(year));
    });
  });
  