"use client";

import { useEffect, useState, useRef } from "react";
import * as d3 from "d3";
import { Switch } from "@heroui/react";
import { Slider } from "@heroui/react";

export default function Home() {
  const [data, setData] = useState([]);
  const [logScale, setLogScale] = useState(false);
  const [smoothingWindow, setSmoothingWindow] = useState(1);
  const chartRef = useRef(null);

  useEffect(() => {
    d3.csv("/chart.csv", d => ({
      date: d3.timeParse("%m/%Y")(d.Date),
      value: +d["MSCI World"]
    })).then(setData);
  }, []);

  const getSmoothedData = () => {
    if (smoothingWindow <= 1) return data;
    const smoothed = [];
    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - smoothingWindow + 1);
      const slice = data.slice(start, i + 1);
      const avg = d3.mean(slice, d => d.value);
      smoothed.push({ date: data[i].date, value: avg });
    }
    return smoothed;
  };

  useEffect(() => {
    if (data.length === 0) return;
    const smoothedData = getSmoothedData();

    const margin = { top: 20, right: 20, bottom: 110, left: 50 },
      margin2 = { top: 430, right: 20, bottom: 30, left: 50 },
      width = 1000 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom,
      height2 = 500 - margin2.top - margin2.bottom;

    d3.select("#chart svg").remove();
    const svg = d3
      .select(chartRef.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", 500);

    const focus = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    const context = svg.append("g").attr("transform", `translate(${margin2.left},${margin2.top})`);

    const x = d3.scaleTime().range([0, width]);
    const x2 = d3.scaleTime().range([0, width]);
    const y2 = logScale ? d3.scaleSymlog().range([height2, 0]) : d3.scaleLinear().range([height2, 0]);

    x.domain(d3.extent(smoothedData, d => d.date));
    x2.domain(x.domain());
    y2.domain(d3.extent(smoothedData, d => logScale && d.value <= 0 ? 1 : d.value));

    let y = logScale ? d3.scaleSymlog().range([height, 0]) : d3.scaleLinear().range([height, 0]);
    y.domain(d3.extent(smoothedData, d => logScale && d.value <= 0 ? 1 : d.value));

    const line = d3.line()
      .x(d => x(d.date))
      .y(d => y(logScale && d.value <= 0 ? 1 : d.value));

    const line2 = d3.line()
      .x(d => x2(d.date))
      .y(d => y2(logScale && d.value <= 0 ? 1 : d.value));

    const path = focus.append("path")
      .datum(smoothedData)
      .attr("class", "line")
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1.5)
      .attr("d", line);

    const xAxis = focus.append("g")
      .attr("transform", `translate(0,${height})`)
      .attr("class", "x-axis")
      .call(d3.axisBottom(x));

    const yAxis = focus.append("g")
      .attr("class", "y-axis")
      .call(logScale ? d3.axisLeft(y).ticks(10, ".0s") : d3.axisLeft(y));

    context.append("path")
      .datum(smoothedData)
      .attr("class", "line")
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1)
      .attr("d", line2);

    context.append("g")
      .attr("transform", `translate(0,${height2})`)
      .call(d3.axisBottom(x2));

    const eventGroup = focus.append("g").attr("class", "events");

    const drawEvents = () => {
      eventGroup.selectAll("line").remove();
      eventGroup.selectAll("text").remove();

      const parseEventDate = d3.timeParse("%m/%Y");
      const events = [
        { date: "03/1980", label: "Volcker Shock" },
        { date: "10/1987", label: "Black Monday" },
        { date: "07/1990", label: "Early 90s Recession" },
        { date: "07/1997", label: "Asian Crisis" },
        { date: "09/1998", label: "LTCM Collapse" },
        { date: "03/2000", label: "Dot-com Bubble Burst" },
        { date: "09/2001", label: "9/11 Attacks" },
        { date: "09/2008", label: "Global Financial Crisis" },
        { date: "05/2010", label: "Eurozone Crisis" },
        { date: "08/2011", label: "US Debt Downgrade" },
        { date: "08/2015", label: "China Market Turmoil" },
        { date: "06/2016", label: "Brexit" },
        { date: "10/2018", label: "Trade War Fears" },
        { date: "03/2020", label: "COVID Crash" },
        { date: "06/2022", label: "Inflation & Rate Hikes" },
        { date: "03/2023", label: "Banking Mini-Crisis" },
        { date: "02/2022", label: "Russia Invades Ukraine" },
        { date: "10/2022", label: "UK Gilt Crisis" },
        { date: "05/2023", label: "US Debt Ceiling Crisis" },
        { date: "10/2023", label: "Israel–Hamas War Begins" },
        { date: "11/2023", label: "AI-Led Rally Begins" },
        { date: "01/2024", label: "Red Sea Shipping Disruptions" },
        { date: "02/2024", label: "Regional Bank Selloff" },
        { date: "03/2024", label: "BoJ Ends Negative Rates" },
        { date: "04/2024", label: "Iran–Israel Tensions" },
        { date: "05/2024", label: "Yields Spike on Fed Talk" },
        { date: "06/2024", label: "Eurozone Growth Warning" },
        { date: "07/2024", label: "China Property Stimulus" },
        { date: "08/2024", label: "Fed Pushes Back on Cuts" },
        { date: "09/2024", label: "Tech Correction Deepens" },
        { date: "10/2024", label: "Election Volatility" },
        { date: "11/2024", label: "Soft CPI, Risk-On Rally" },
        { date: "12/2024", label: "Fed Hints at 2025 Cuts" },
        { date: "01/2024", label: "Fed Pivot Optimism" }
      ].map(d => ({ date: parseEventDate(d.date), label: d.label }));

      events.forEach(event => {
        eventGroup.append("line")
          .attr("x1", x(event.date))
          .attr("y1", 0)
          .attr("x2", x(event.date))
          .attr("y2", height)
          .attr("stroke", "red")
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "4");

        eventGroup.append("text")
          .attr("x", x(event.date))
          .attr("y", 12)
          .attr("transform", `rotate(-80, ${x(event.date)}, 12)`)
          .text(event.label)
          .attr("fill", "black")
          .attr("font-size", "12px")
          .attr("text-anchor", "end");
      });
    };

    drawEvents();

    const brush = d3.brushX()
      .extent([[0, 0], [width, height2]])
      .on("brush end", event => {
        const selection = event.selection;
        if (selection) {
          const [x0, x1] = selection.map(x2.invert);
          x.domain([x0, x1]);

          const filtered = smoothedData.filter(d => d.date >= x0 && d.date <= x1);
          let newY;
          if (logScale) {
            const min = d3.min(filtered, d => d.value <= 0 ? 1 : d.value);
            const max = d3.max(filtered, d => d.value);
            const ySpan = max / min;
            newY = ySpan < 1.3
              ? d3.scaleLinear().range([height, 0]).domain([min, max])
              : d3.scaleSymlog().range([height, 0]).domain([min, max]);
          } else {
            newY = d3.scaleLinear().range([height, 0]).domain(d3.extent(filtered, d => d.value));
          }
          y = newY;
          line.y(d => y(logScale && d.value <= 0 ? 1 : d.value));

          path.attr("d", line);
          xAxis.call(d3.axisBottom(x));
          yAxis.call(logScale ? d3.axisLeft(y).ticks(10, ".0s") : d3.axisLeft(y));
          drawEvents();
        }
      });

    const brushGroup = context.append("g")
      .attr("class", "brush")
      .call(brush)
      .call(brush.move, x.range());

    brushGroup.selectAll(".selection")
      .attr("fill", "#42a5f5")
      .attr("fill-opacity", 0.4)
      .attr("stroke", "#1976d2")
      .attr("stroke-width", 1);

    brushGroup.selectAll(".handle")
      .attr("fill", "#1976d2")
      .attr("stroke", "white")
      .attr("cursor", "ew-resize");

    brushGroup.selectAll(".overlay")
      .attr("fill", "transparent");
  }, [data, logScale, smoothingWindow]);

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold">MSCI World Index (USD) with Major Financial Events</h2>
      <Switch
        isSelected={logScale}
        onValueChange={setLogScale}
        color="primary"
      >
        Log Scale
      </Switch>
      <div className="w-72">
        <Slider
          label={`Smoothing Window: ${smoothingWindow} month${smoothingWindow > 1 ? "s" : ""}`}
          step={1}
          minValue={1}
          maxValue={24}
          value={smoothingWindow}
          onChange={setSmoothingWindow}
        />
      </div>
      <div id="chart" ref={chartRef} className="relative mt-6" />
    </div>
  );
}

// Place `chart.csv` into the public/ folder so it's available at /chart.csv
