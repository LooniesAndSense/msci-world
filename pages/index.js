"use client";

import { useEffect, useState, useRef } from "react";
import * as d3 from "d3";
import { Switch } from "@heroui/react";
import { Slider } from "@heroui/react";
import { useTheme } from "next-themes";
import { Checkbox } from "@heroui/react";
import { ThemeSwitch } from "../components/theme-switch"

// Define major events for easy filtering
const MAJOR_EVENTS = {
  SHOW_ONLY_BLACK_MONDAY: "showOnlyBlackMonday",
  SHOW_ONLY_GFC: "showOnlyGFC",
  SHOW_ONLY_COVID: "showOnlyCovid"
};

export default function Home() {
  const [data, setData] = useState([]);
  const [logScale, setLogScale] = useState(false);
  const [smoothingWindow, setSmoothingWindow] = useState(1);
  const [showEvents, setShowEvents] = useState(true);
  // Event filter state - when any of these are true, we'll only show that specific event
  const [eventFilters, setEventFilters] = useState({
    [MAJOR_EVENTS.SHOW_ONLY_BLACK_MONDAY]: false,
    [MAJOR_EVENTS.SHOW_ONLY_GFC]: false,
    [MAJOR_EVENTS.SHOW_ONLY_COVID]: false
  });
  const chartRef = useRef(null);
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // After mounting, we can safely access the theme
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load MSCI World Index data
  useEffect(() => {
    d3.csv("/chart.csv", d => ({
      date: d3.timeParse("%m/%Y")(d.Date),
      value: +d["MSCI World"]
    })).then(setData);
  }, []);

  // Handle changes to event filter checkboxes
  const handleEventFilterChange = (eventKey) => {
    setEventFilters(prev => ({
      ...prev,
      [eventKey]: !prev[eventKey]
    }));
  };

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
      handleFill: isDarkMode ? '#6ab7ff' : '#1976d2',
      gridLine: isDarkMode ? "#333333" : "#eaeaea"
    };

    const margin = { top: 20, right: 30, bottom: 110, left: 50 },
      margin2 = { top: 430, right: 30, bottom: 30, left: 50 },
      width = 1600 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom,
      height2 = 500 - margin2.top - margin2.bottom;

    d3.select("#chart svg").remove();
    d3.select("#chart .tooltip").remove();
    
    const svg = d3
      .select(chartRef.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", 500);

    const focus = svg.append("g")
      .attr("class", "focus")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Add clipping path to prevent lines from overshooting
    focus.append("clipPath")
      .attr("id", "clip")
      .append("rect")
      .attr("width", width)
      .attr("height", height);
    
    const context = svg.append("g")
      .attr("class", "context")
      .attr("transform", `translate(${margin2.left},${margin2.top})`);
      
    // Add clipping path for the context/brush area
    context.append("clipPath")
      .attr("id", "clip-context")
      .append("rect")
      .attr("width", width)
      .attr("height", height2);

    // Scales for main chart
    const x = d3.scaleTime().range([0, width]);
    let y = logScale ? d3.scaleSymlog().range([height, 0]) : d3.scaleLinear().range([height, 0]);
    
    // Scales for context chart (brush)
    const x2 = d3.scaleTime().range([0, width]);
    const y2Context = logScale ? d3.scaleSymlog().range([height2, 0]) : d3.scaleLinear().range([height2, 0]);

    // Set domains
    const dateExtent = d3.extent(smoothedData, d => d.date);
    x.domain(dateExtent);
    x2.domain(x.domain());
    
    // Add padding to domains to prevent lines touching edges
    const addPadding = (domain, paddingPercent = 0.05) => {
      const range = domain[1] - domain[0];
      const padding = range * paddingPercent;
      return [domain[0] - padding, domain[1] + padding];
    };
    
    // Set y domains with padding
    let msciExtent = d3.extent(smoothedData, d => logScale && d.value <= 0 ? 1 : d.value);
    msciExtent = addPadding(msciExtent);
    y.domain(msciExtent);
    y2Context.domain(y.domain());

    // Line generators
    const line = d3.line()
      .x(d => x(d.date))
      .y(d => y(logScale && d.value <= 0 ? 1 : d.value));

    const line2 = d3.line()
      .x(d => x2(d.date))
      .y(d => y2Context(logScale && d.value <= 0 ? 1 : d.value));

    // Add grid lines
    focus.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x)
        .tickSize(-height)
        .tickFormat(""))
      .selectAll("line")
      .attr("stroke", colors.gridLine)
      .attr("stroke-opacity", 0.6);

    focus.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(y)
        .tickSize(-width)
        .tickFormat(""))
      .selectAll("line")
      .attr("stroke", colors.gridLine)
      .attr("stroke-opacity", 0.6);

    // Add MSCI World Index line
    const path = focus.append("path")
      .datum(smoothedData)
      .attr("class", "line")
      .attr("clip-path", "url(#clip)")
      .attr("fill", "none")
      .attr("stroke", colors.line)
      .attr("stroke-width", 2)
      .attr("d", line);

    // Add x-axis
    const xAxis = focus.append("g")
      .attr("transform", `translate(0,${height})`)
      .attr("class", "x-axis")
      .call(d3.axisBottom(x));

    // Style x-axis
    xAxis.selectAll("line").attr("stroke", colors.axis);
    xAxis.selectAll("path").attr("stroke", colors.axis);
    xAxis.selectAll("text").attr("fill", isDarkMode ? "#ffffff" : "#000000");

    // Add primary y-axis (MSCI World)
    const yAxis = focus.append("g")
      .attr("class", "y-axis")
      .call(logScale ? d3.axisLeft(y).ticks(10, ".0s") : d3.axisLeft(y));

    // Style primary y-axis
    yAxis.selectAll("line").attr("stroke", colors.axis);
    yAxis.selectAll("path").attr("stroke", colors.axis);
    yAxis.selectAll("text").attr("fill", isDarkMode ? "#ffffff" : "#000000");

    // Add context chart line
    context.append("path")
      .datum(smoothedData)
      .attr("class", "line")
      .attr("clip-path", "url(#clip-context)")
      .attr("fill", "none")
      .attr("stroke", colors.line)
      .attr("stroke-width", 1)
      .attr("d", line2);

    // Add context chart x-axis
    const contextAxis = context.append("g")
      .attr("transform", `translate(0,${height2})`)
      .call(d3.axisBottom(x2));

    // Style context x-axis
    contextAxis.selectAll("line").attr("stroke", colors.axis);
    contextAxis.selectAll("path").attr("stroke", colors.axis);
    contextAxis.selectAll("text").attr("fill", isDarkMode ? "#ffffff" : "#000000");

    // Create legend
    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${margin.left + 20}, 20)`);

    // MSCI World legend item
    legend.append("line")
      .attr("x1", 0)
      .attr("y1", -14)
      .attr("x2", 20)
      .attr("y2", -14)
      .style("stroke", colors.line)
      .style("stroke-width", 2);

    legend.append("text")
      .attr("x", 25)
      .attr("y", -10)
      .text("MSCI World USD")
      .style("font-size", "10px")
      .style("fill", isDarkMode ? "#ffffff" : "#000000");

    // Create an event group to hold all event markers and labels
    const eventGroup = focus.append("g")
      .attr("class", "events")
      .attr("clip-path", "url(#clip)");
      
    // Add logo watermark - directly to SVG instead of focus group
    svg.append("image")
      .attr("class", "watermark")
      .attr("href", "/looniesandsense.png")
      .attr("width", 100)
      .attr("height", 100)
      .attr("x", margin.left + 1400) // Position from left edge of SVG
      .attr("y", 275) // Position from top edge of SVG
      .attr("opacity", 0.5)
      .attr("preserveAspectRatio", "xMidYMid meet");

    // Function to draw or update event markers
    const drawEvents = () => {
      // Clear existing events
      eventGroup.selectAll("*").remove();
      
      // If events are turned off, return early without drawing anything
      if (!showEvents) return;

      const parseEventDate = d3.timeParse("%m/%Y");
      
      // Define all events with identifiers for the major ones we want to filter
      const allEvents = [
        { date: "03/1980", label: "Volcker Shock" },
        { date: "10/1987", label: "Black Monday", id: "blackMonday" },
        { date: "07/1990", label: "Early 90s Recession" },
        { date: "07/1997", label: "Asian Crisis" },
        { date: "09/1998", label: "LTCM Collapse" },
        { date: "03/2000", label: "Dot-com Bubble Burst" },
        { date: "09/2001", label: "9/11 Attacks" },
        { date: "09/2008", label: "Global Financial Crisis", id: "gfc" },
        { date: "05/2010", label: "Eurozone Crisis" },
        { date: "08/2011", label: "US Debt Downgrade" },
        { date: "08/2015", label: "China Market Turmoil" },
        { date: "06/2016", label: "Brexit" },
        { date: "10/2018", label: "Trade War Fears" },
        { date: "03/2020", label: "COVID Crash", id: "covid" },
        { date: "06/2022", label: "Inflation & Rate Hikes" },
        { date: "03/2023", label: "Banking Mini-Crisis" },
        { date: "02/2022", label: "Russia Invades Ukraine" },
        { date: "05/2023", label: "US Debt Ceiling Crisis" },
        { date: "10/2023", label: "Israel–Hamas War Begins" },
        { date: "11/2023", label: "AI-Led Rally Begins" },
        { date: "03/2024", label: "BoJ Ends Negative Rates" },
        { date: "06/2024", label: "Eurozone Growth Warning" },
        { date: "07/2024", label: "China Property Stimulus" },
        { date: "09/2024", label: "Tech Correction Deepens" },
        { date: "10/2024", label: "Election Volatility" },
      ];
      
      // Check if any filter is active
      const anyFilterActive = Object.values(eventFilters).some(value => value);
      
      // Filter events based on filter checkboxes
      let filteredEvents;
      
      if (anyFilterActive) {
        // If any filter is active, only show selected events
        filteredEvents = allEvents.filter(event => {
          if (event.id === "blackMonday" && eventFilters[MAJOR_EVENTS.SHOW_ONLY_BLACK_MONDAY]) return true;
          if (event.id === "gfc" && eventFilters[MAJOR_EVENTS.SHOW_ONLY_GFC]) return true;
          if (event.id === "covid" && eventFilters[MAJOR_EVENTS.SHOW_ONLY_COVID]) return true;
          return false;
        });
      } else {
        // If no filter active, show all events
        filteredEvents = allEvents;
      }
      
      // Parse dates for filtered events
      filteredEvents = filteredEvents.map(d => ({
        date: parseEventDate(d.date),
        label: d.label,
        id: d.id
      }));

      // Draw all filtered events with the original styling
      filteredEvents.forEach(event => {
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
          .attr("transform", `rotate(-90, ${x(event.date)}, 12)`)
          .text(event.label)
          .attr("fill", isDarkMode ? "#ffffff" : "#000000")
          .attr("font-size", "12px")
          .attr("text-anchor", "end");
      });
    };

    // Initial draw of events
    drawEvents();

    // Brush handling function
    const updateChart = (selection) => {
      if (!selection) return;
      
      const [x0, x1] = selection.map(x2.invert);
      x.domain([x0, x1]);

      const filtered = smoothedData.filter(d => d.date >= x0 && d.date <= x1);
      
      // Update main chart y-axis
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
      
      // Update main chart
      y = newY;
      line.y(d => y(logScale && d.value <= 0 ? 1 : d.value));
      path.attr("d", line);
      
      // Update axes
      xAxis.call(d3.axisBottom(x));
      yAxis.call(logScale ? d3.axisLeft(y).ticks(10, ".0s") : d3.axisLeft(y));
      
      // Re-style the axes after update
      xAxis.selectAll("line").attr("stroke", colors.axis);
      xAxis.selectAll("path").attr("stroke", colors.axis);
      xAxis.selectAll("text").attr("fill", isDarkMode ? "#ffffff" : "#000000");
      
      yAxis.selectAll("line").attr("stroke", colors.axis);
      yAxis.selectAll("path").attr("stroke", colors.axis);
      yAxis.selectAll("text").attr("fill", isDarkMode ? "#ffffff" : "#000000");
      
      // Redraw events
      drawEvents();
    };

    // Create brush for the context area
    const brush = d3.brushX()
      .extent([[0, 0], [width, height2]])
      .on("brush end", event => {
        updateChart(event.selection);
      });

    const brushGroup = context.append("g")
      .attr("class", "brush")
      .call(brush)
      .call(brush.move, x.range());
      
    // Ensure brush stays within bounds
    brushGroup.select(".overlay")
      .attr("clip-path", "url(#clip-context)");

    // Create tooltip
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
      .attr("clip-path", "url(#clip)")
      .style("stroke", colors.axis)
      .style("stroke-width", "1px")
      .style("opacity", 0);
      
    // Create a circle that follows the data point for MSCI World
    const mouseCircle = focus.append("circle")
      .attr("class", "mouse-circle")
      .attr("clip-path", "url(#clip)")
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
      .attr("clip-path", "url(#clip)")
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
        
        // Find the closest MSCI data point
        const i = bisectDate(smoothedData, x0, 1);
        if (i >= smoothedData.length) return;
        
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
        
        // Build tooltip content
        let tooltipContent = `<strong>Date:</strong> ${formatDate(d.date)}<br>
                             <strong>MSCI:</strong> ${formatValue(d.value)}<br>
                             <strong>Total Return:</strong> ${formatPercent(totalReturn)}%`;
        
        // Position the tooltip
        tooltip
          .html(tooltipContent)
          .style("left", (x(d.date) + margin.left + 10) + "px")
          .style("top", (y(d.value) + margin.top - 30) + "px");
        
        // Position the vertical line
        mouseLine
          .attr("x1", x(d.date))
          .attr("y1", 0)
          .attr("x2", x(d.date))
          .attr("y2", height);
          
        // Position the MSCI circle
        mouseCircle
          .attr("cx", x(d.date))
          .attr("cy", y(d.value));
      });

    // Style brush elements
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
      
  }, [data, logScale, smoothingWindow, theme, resolvedTheme, mounted, showEvents, eventFilters]);

  return (
    <div className="p-4 space-y-4 dark:bg-gray-900 dark:text-white transition-colors">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Tune Out the Noise: How Do World Events Affect the Stock Market?</h2>
        <ThemeSwitch />
      </div>
      
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center space-x-2">
          <Switch
            id="log-scale-switch"
            isSelected={logScale}
            onValueChange={setLogScale}
            color="primary"
            aria-label="Toggle logarithmic scale"
          />
          <label htmlFor="log-scale-switch" className="cursor-pointer">
            Log Scale
          </label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="show-events-switch"
            isSelected={showEvents}
            onValueChange={setShowEvents}
            color="primary"
            aria-label="Toggle event markers"
          />
          <label htmlFor="show-events-switch" className="cursor-pointer">
            Show Events
          </label>
        </div>
        
        <div className="w-72">
          <Slider
            label={"Smoothing"}
            step={1}
            minValue={1}
            maxValue={12}
            value={smoothingWindow}
            onChange={setSmoothingWindow}
          />
        </div>
      </div>
      
      {/* Event Filter Checkboxes */}
      <div className="flex flex-wrap items-center gap-4 ml-2 pl-4 border-l-2 border-gray-300 dark:border-gray-700">
        <span className="text-sm font-medium">Highlight Major Event</span>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="black-monday-checkbox"
            isSelected={eventFilters[MAJOR_EVENTS.SHOW_ONLY_BLACK_MONDAY]}
            onValueChange={() => handleEventFilterChange(MAJOR_EVENTS.SHOW_ONLY_BLACK_MONDAY)}
            color="primary"
            aria-label="Show only Black Monday"
          />
          <label htmlFor="black-monday-checkbox" className="cursor-pointer text-sm">
            Black Monday (1987)
          </label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="gfc-checkbox"
            isSelected={eventFilters[MAJOR_EVENTS.SHOW_ONLY_GFC]}
            onValueChange={() => handleEventFilterChange(MAJOR_EVENTS.SHOW_ONLY_GFC)}
            color="primary"
            aria-label="Show only Global Financial Crisis"
          />
          <label htmlFor="gfc-checkbox" className="cursor-pointer text-sm">
            Global Financial Crisis (2008)
          </label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="covid-crash-checkbox"
            isSelected={eventFilters[MAJOR_EVENTS.SHOW_ONLY_COVID]}
            onValueChange={() => handleEventFilterChange(MAJOR_EVENTS.SHOW_ONLY_COVID)}
            color="primary"
            aria-label="Show only COVID Crash"
          />
          <label htmlFor="covid-crash-checkbox" className="cursor-pointer text-sm">
            COVID Crash (2020)
          </label>
        </div>
      </div>
      
      <div id="chart" ref={chartRef} className="relative mt-6 rounded-lg overflow-hidden dark:bg-gray-800 p-2 transition-colors" />
    </div>
  );
}