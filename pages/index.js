"use client";

import { useEffect, useState, useRef } from "react";
import * as d3 from "d3";
import { Switch } from "@heroui/react";
import { Slider } from "@heroui/react";
import { useTheme } from "next-themes";
import { ThemeSwitch } from "@/components/theme-switch"; // Your existing component

export default function Home() {
  const [data, setData] = useState([]);
  const [logScale, setLogScale] = useState(false);
  const [smoothingWindow, setSmoothingWindow] = useState(1);
  const chartRef = useRef(null);
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // After mounting, we can safely access the theme
  useEffect(() => {
    setMounted(true);
  }, []);

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
    if (data.length === 0 || !mounted) return;
    const smoothedData = getSmoothedData();
    const isDarkMode = resolvedTheme === 'dark';

    // Define colors based on theme
    const colors = {
      line: isDarkMode ? '#6ab7ff' : 'steelblue',
      axis: isDarkMode ? '#888888' : '#666666',
      eventLine: isDarkMode ? '#ff5555' : 'red',
      tooltipBg: isDarkMode ? '#222222' : 'white',
      tooltipText: isDarkMode ? '#ffffff' : '#000000',
      tooltipBorder: isDarkMode ? '#555555' : '#ccc',
      brushFill: isDarkMode ? 'rgba(106, 183, 255, 0.3)' : 'rgba(66, 165, 245, 0.4)',
      brushStroke: isDarkMode ? '#6ab7ff' : '#1976d2',
      handleFill: isDarkMode ? '#6ab7ff' : '#1976d2'
    };

    const margin = { top: 20, right: 20, bottom: 110, left: 50 },
      margin2 = { top: 430, right: 20, bottom: 30, left: 50 },
      width = 1500 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom,
      height2 = 500 - margin2.top - margin2.bottom;

    d3.select("#chart svg").remove();
    d3.select("#chart .tooltip").remove();
    
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

    // Add grid lines
    focus.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x)
        .tickSize(-height)
        .tickFormat(""))
      .selectAll("line")
      .attr("stroke", isDarkMode ? "#333333" : "#eaeaea")
      .attr("stroke-opacity", 0.6);

    focus.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(y)
        .tickSize(-width)
        .tickFormat(""))
      .selectAll("line")
      .attr("stroke", isDarkMode ? "#333333" : "#eaeaea")
      .attr("stroke-opacity", 0.6);

    const path = focus.append("path")
      .datum(smoothedData)
      .attr("class", "line")
      .attr("fill", "none")
      .attr("stroke", colors.line)
      .attr("stroke-width", 1.5)
      .attr("d", line);

    const xAxis = focus.append("g")
      .attr("transform", `translate(0,${height})`)
      .attr("class", "x-axis")
      .call(d3.axisBottom(x));

    // Style axes based on theme
    xAxis.selectAll("line").attr("stroke", colors.axis);
    xAxis.selectAll("path").attr("stroke", colors.axis);
    xAxis.selectAll("text").attr("fill", isDarkMode ? "#ffffff" : "#000000");

    const yAxis = focus.append("g")
      .attr("class", "y-axis")
      .call(logScale ? d3.axisLeft(y).ticks(10, ".0s") : d3.axisLeft(y));

    // Style axes based on theme
    yAxis.selectAll("line").attr("stroke", colors.axis);
    yAxis.selectAll("path").attr("stroke", colors.axis);
    yAxis.selectAll("text").attr("fill", isDarkMode ? "#ffffff" : "#000000");

    context.append("path")
      .datum(smoothedData)
      .attr("class", "line")
      .attr("fill", "none")
      .attr("stroke", colors.line)
      .attr("stroke-width", 1)
      .attr("d", line2);

    const contextAxis = context.append("g")
      .attr("transform", `translate(0,${height2})`)
      .call(d3.axisBottom(x2));

    // Style context axis based on theme
    contextAxis.selectAll("line").attr("stroke", colors.axis);
    contextAxis.selectAll("path").attr("stroke", colors.axis);
    contextAxis.selectAll("text").attr("fill", isDarkMode ? "#ffffff" : "#000000");

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
        { date: "05/2024", label: "Yields Spike on US Fed Talk" },
        { date: "06/2024", label: "Eurozone Growth Warning" },
        { date: "07/2024", label: "China Property Stimulus" },
        { date: "08/2024", label: "US Fed Pushes Back on Cuts" },
        { date: "09/2024", label: "Tech Correction Deepens" },
        { date: "10/2024", label: "Election Volatility" },
        { date: "11/2024", label: "Soft CPI, Risk-On Rally" },
      ].map(d => ({ date: parseEventDate(d.date), label: d.label }));

      events.forEach(event => {
        eventGroup.append("line")
          .attr("x1", x(event.date))
          .attr("y1", 0)
          .attr("x2", x(event.date))
          .attr("y2", height)
          .attr("stroke", colors.eventLine)
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "4");

        eventGroup.append("text")
          .attr("x", x(event.date))
          .attr("y", 12)
          .attr("transform", `rotate(-85, ${x(event.date)}, 12)`)
          .text(event.label)
          .attr("fill", isDarkMode ? "#ffffff" : "#000000")
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
          
          // Re-style the axes after update
          xAxis.selectAll("line").attr("stroke", colors.axis);
          xAxis.selectAll("path").attr("stroke", colors.axis);
          xAxis.selectAll("text").attr("fill", isDarkMode ? "#ffffff" : "#000000");
          
          yAxis.selectAll("line").attr("stroke", colors.axis);
          yAxis.selectAll("path").attr("stroke", colors.axis);
          yAxis.selectAll("text").attr("fill", isDarkMode ? "#ffffff" : "#000000");
          
          drawEvents();
        }
      });

    const brushGroup = context.append("g")
      .attr("class", "brush")
      .call(brush)
      .call(brush.move, x.range());

    const tooltip = d3.select("#chart")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background", colors.tooltipBg)
      .style("color", colors.tooltipText)
      .style("border", `1px solid ${colors.tooltipBorder}`)
      .style("border-radius", "4px")
      .style("padding", "6px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("z-index", 10);

    const bisectDate = d3.bisector(d => d.date).left;
    
    // Create a vertical line that follows the mouse
    const mouseLine = focus.append("line")
      .attr("class", "mouse-line")
      .style("stroke", colors.axis)
      .style("stroke-width", "1px")
      .style("opacity", 0);
      
    // Create a circle that follows the data point
    const mouseCircle = focus.append("circle")
      .attr("class", "mouse-circle")
      .attr("r", 5)
      .style("fill", colors.line)
      .style("stroke", isDarkMode ? "#000000" : "#ffffff")
      .style("stroke-width", "2px")
      .style("opacity", 0);
      
    // Add the overlay rect for mouse tracking
    const overlay = focus.append("rect")
      .attr("class", "overlay")
      .attr("width", width)
      .attr("height", height)
      .style("fill", "none")
      .style("pointer-events", "all")
      .on("mouseover", function() {
        tooltip.style("opacity", 1);
        mouseLine.style("opacity", 1);
        mouseCircle.style("opacity", 1);
      })
      .on("mouseout", function() {
        tooltip.style("opacity", 0);
        mouseLine.style("opacity", 0);
        mouseCircle.style("opacity", 0);
      })
      .on("mousemove", function(event) {
        // Get mouse position
        const [xPos] = d3.pointer(event, this);
        const x0 = x.invert(xPos);
        const i = bisectDate(smoothedData, x0, 1);
        
        if (i >= smoothedData.length) return;
        
        // Find the closest data point
        const d0 = i > 0 ? smoothedData[i - 1] : smoothedData[0];
        const d1 = smoothedData[i];
        const d = x0 - d0.date > d1.date - x0 ? d1 : d0;
        
        // Calculate total return since beginning of data period
        const firstDataPoint = smoothedData[0];
        const totalReturn = ((d.value - firstDataPoint.value) / firstDataPoint.value) * 100;
        
        // Format date, value and total return for tooltip
        const formatDate = d3.timeFormat("%B %Y");
        const formatValue = d3.format(",.2f");
        const formatPercent = d3.format("+,.2f");
        
        // Position the tooltip
        tooltip
          .html(`<strong>Date:</strong> ${formatDate(d.date)}<br>
                 <strong>Value:</strong> ${formatValue(d.value)}<br>
                 <strong>Total Return:</strong> ${formatPercent(totalReturn)}%`)
          .style("left", (x(d.date) + margin.left + 10) + "px")
          .style("top", (y(d.value) + margin.top - 30) + "px");
        
        // Position the vertical line
        mouseLine
          .attr("x1", x(d.date))
          .attr("y1", 0)
          .attr("x2", x(d.date))
          .attr("y2", height);
          
        // Position the circle
        mouseCircle
          .attr("cx", x(d.date))
          .attr("cy", y(d.value));
      });

    brushGroup.selectAll(".selection")
      .attr("fill", colors.brushFill)
      .attr("stroke", colors.brushStroke)
      .attr("stroke-width", 1);

    brushGroup.selectAll(".handle")
      .attr("fill", colors.handleFill)
      .attr("stroke", isDarkMode ? "#000000" : "#ffffff")
      .attr("cursor", "ew-resize");

    brushGroup.selectAll(".overlay")
      .attr("fill", "transparent");
  }, [data, logScale, smoothingWindow, theme, resolvedTheme, mounted]);

  return (
    <div className="p-4 space-y-4 dark:bg-gray-900 dark:text-white transition-colors">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">MSCI World Index (USD) with Major Financial Events</h2>
        <ThemeSwitch />
      </div>
      
      <div className="flex flex-wrap items-center gap-4">
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
      </div>
      
      <div id="chart" ref={chartRef} className="relative mt-6 rounded-lg overflow-hidden dark:bg-gray-800 p-2 transition-colors" />
    </div>
  );
}