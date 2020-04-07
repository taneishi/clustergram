d3.tsv("data/heatmap.tsv", function(data) {
    return { row: data.row_idx, col: data.col_idx, value: +data.log2ratio };
}, function(error, data){
    console.log(data);
    var margin = { top: 70, right: 10, bottom: 50, left: 100 };
    var cellSize = 11; //12;

    var c1 = d3.range(0,1,0.1).map(d3.interpolateRgb('#005824', '#EDF8FB'));
    var c2 = d3.range(0,1,0.1).map(d3.interpolateRgb('#F1EEF6', '#91003F'));
    var colors = c1.concat(['#FFFFFF']).concat(c2);
    var colorBuckets = colors.length;

    var rowLabel = d3.set(data.map(function(d){ return d.row; })).values();
    var colLabel = d3.set(data.map(function(d){ return d.col; })).values();

    data.map(function(d){
        d.row = +rowLabel.indexOf(d.row);
        d.col = +colLabel.indexOf(d.col);
    });

    var compare = function(key){
        return function(a,b){
            return (key[a] < key[b]) ? -1 : (key[a] > key[b]) ? 1 : 0;
        };
    };

    hcrow = d3.range(rowLabel.length).sort(compare(rowLabel));
    hccol = d3.range(colLabel.length).sort(compare(colLabel));

    width = cellSize * colLabel.length; // - margin.left - margin.right;
    height = cellSize * rowLabel.length; // - margin.top - margin.bottom;
    var legendElementWidth = cellSize * 2.5;

    var colorScale = d3.scale.quantile()
        .domain([-10, 0, 10])
        .range(colors);
  
    var svg = d3.select("#chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var rowSortOrder = false;
    var colSortOrder = false;

    var rowLabels = svg.append("g")
        .selectAll(".rowLabelg")
        .data(rowLabel)
        .enter()
        .append("text")
        .text(function (d){ return d; })
        .attr("x", 0)
        .attr("y", function (d, i){ return hcrow.indexOf(i) * cellSize; })
        .style("text-anchor", "end")
        .attr("transform", "translate(-6," + cellSize / 1.5 + ")")
        .attr("class", function(d,i){ return "rowLabel mono r"+i;} ) 
        .on("mouseover", function(d){d3.select(this).classed("text-hover",true);})
        .on("mouseout" , function(d){d3.select(this).classed("text-hover",false);})
        .on("click", function(d,i){
            rowSortOrder = !rowSortOrder;
            sortbylabel("r",i,rowSortOrder);
            d3.select("#order").property("selectedIndex", 4).node().focus();
        });

    var colLabels = svg.append("g")
        .selectAll(".colLabelg")
        .data(colLabel)
        .enter()
        .append("text")
        .text(function(d){ return d; })
        .attr("x", 0)
        .attr("y", function(d, i){ return hccol.indexOf(i) * cellSize; })
        .style("text-anchor", "left")
        .attr("transform", "translate("+cellSize/2 + ",-6) rotate (-90)")
        .attr("class",  function(d,i){ return "colLabel mono c"+i;} )
        .on("mouseover", function(d){d3.select(this).classed("text-hover",true);})
        .on("mouseout" , function(d){d3.select(this).classed("text-hover",false);})
        .on("click", function(d,i){
            colSortOrder = !colSortOrder;
            sortbylabel("c",i,colSortOrder);
            d3.select("#order").property("selectedIndex", 4).node().focus();
        });

    var heatMap = svg.append("g").attr("class","g3")
        .selectAll(".cellg")
        .data(data,function(d){return d.row+":"+d.col;})
        .enter()
        .append("rect")
        .attr("x", function(d){ return hccol.indexOf(d.col) * cellSize; })
        .attr("y", function(d){ return hcrow.indexOf(d.row) * cellSize; })
        .attr("class", function(d){ return "cell cell-border cr"+d.row+" cc"+d.col; })
        .attr("width", cellSize)
        .attr("height", cellSize)
        .style("fill", function(d){ return colorScale(d.value); })
        /*.on("click", function(d) {
            var rowtext=d3.select(".r"+(d.row-1));
            if(rowtext.classed("text-selected")==false){
                rowtext.classed("text-selected",true);
            }else{
                rowtext.classed("text-selected",false);
            }
        })*/
        .on("mouseover", function(d){
            // highlight text
            d3.select(this).classed("cell-hover",true);
            d3.selectAll(".rowLabel").classed("text-highlight",function(r,ri){ return ri==+d.row;});
            d3.selectAll(".colLabel").classed("text-highlight",function(c,ci){ return ci==+d.col;});
        
            // Update the tooltip position and value
            d3.select("#tooltip")
                .style("left", (d3.event.pageX+10) + "px")
                .style("top", (d3.event.pageY-10) + "px")
                .select("#value")
                .text("row: "+rowLabel[d.row]+", "+d.row+"\n"
                    +"col: "+colLabel[d.col]+", "+d.col+"\n"
                    +"data:"+d.value+"\n"
                    +"cell-xy: "+this.x.baseVal.value+", "+this.y.baseVal.value);
            // Show the tooltip
            d3.select("#tooltip").classed("hidden", false);
        })
        .on("mouseout", function(){
            d3.select(this).classed("cell-hover",false);
            d3.selectAll(".rowLabel").classed("text-highlight",false);
            d3.selectAll(".colLabel").classed("text-highlight",false);
            d3.select("#tooltip").classed("hidden", true);
        });

    var legend = svg.selectAll(".legend")
        .data(d3.range(-10,11,1))
        .enter().append("g")
        .attr("class", "legend");
 
    legend.append("rect")
        .attr("x", function(d, i) { return legendElementWidth * i; })
        .attr("y", height+(cellSize*2))
        .attr("width", legendElementWidth)
        .attr("height", cellSize)
        .style("fill", function(d, i) { return colors[i]; });
 
    legend.append("text")
        .attr("class", "mono")
        .text(function(d) { return d; })
        .attr("width", legendElementWidth)
        .attr("x", function(d, i) { return legendElementWidth * i; })
        .attr("y", height + (cellSize*4));

    // Change ordering of cells

    function sortbylabel(rORc,i,sortOrder){
        var t = svg.transition().duration(1000);
        var log2r = [];
        var sorted; // sorted is zero-based index
        d3.selectAll(".c"+rORc+i) 
            .filter(function(ce){
                log2r.push(ce.value);
            });

        if(rORc=="r"){ // sort log2ratio of a gene
            sorted = d3.range(colLabel.length).sort(function(a,b){
                return sortOrder ? log2r[b]-log2r[a] : log2r[a]-log2r[b];
            });
            t.selectAll(".cell")
                .attr("x", function(d) { return sorted.indexOf(d.col) * cellSize; });
            t.selectAll(".colLabel")
                .attr("y", function (d, i) { return sorted.indexOf(i) * cellSize; });

        }else{ // sort log2ratio of a contrast
            sorted = d3.range(rowLabel.length).sort(function(a,b){
                return sortOrder ? log2r[b]-log2r[a] : log2r[a]-log2r[b];
            });
            t.selectAll(".cell")
                .attr("y", function(d) { return sorted.indexOf(d.row) * cellSize; });
            t.selectAll(".rowLabel")
                .attr("y", function (d, i) { return sorted.indexOf(i) * cellSize; });
        }
    }

    d3.select("#order").on("change",function(){
        order(this.value);
    });
  
    function order(value){
        if(value=="hclust"){
            var t = svg.transition().duration(1000);
            t.selectAll(".cell")
                .attr("x", function(d) { return hccol.indexOf(d.col) * cellSize; })
                .attr("y", function(d) { return hcrow.indexOf(d.row) * cellSize; });
            t.selectAll(".rowLabel")
                .attr("y", function (d, i) { return hcrow.indexOf(i) * cellSize; });
            t.selectAll(".colLabel")
                .attr("y", function (d, i) { return hccol.indexOf(i) * cellSize; });

        }else if (value=="probecontrast"){
            var t = svg.transition().duration(1000);
            t.selectAll(".cell")
                .attr("x", function(d) { return d.col * cellSize; })
                .attr("y", function(d) { return d.row * cellSize; });
            t.selectAll(".rowLabel")
                .attr("y", function (d, i) { return i * cellSize; });
            t.selectAll(".colLabel")
                .attr("y", function (d, i) { return i * cellSize; });

        }else if (value=="probe"){
            var t = svg.transition().duration(1000);
            t.selectAll(".cell")
                .attr("y", function(d) { return d.row * cellSize; });
            t.selectAll(".rowLabel")
                .attr("y", function (d, i) { return i * cellSize; });

        }else if (value=="contrast"){
            var t = svg.transition().duration(1000);
            t.selectAll(".cell")
                .attr("x", function(d) { return d.col * cellSize; });
            t.selectAll(".colLabel")
                .attr("y", function (d, i) { return i * cellSize; });
        }
    }

// Event handlers

    var sa = d3.select(".g3")
        .on("mousedown", function() {
            if( !d3.event.altKey) {
                d3.selectAll(".cell-selected").classed("cell-selected",false);
                d3.selectAll(".rowLabel").classed("text-selected",false);
                d3.selectAll(".colLabel").classed("text-selected",false);
            }
            var p = d3.mouse(this);
            sa.append("rect")
                .attr({
                    rx: 0, ry: 0,
                    class: "selection",
                    x: p[0], y: p[1],
                    width: 1, height: 1
                });
        })
        .on("mousemove", function() {
            var s = sa.select("rect.selection");
      
            if(!s.empty()) {
                var p = d3.mouse(this),
                d = {
                    x: parseInt(s.attr("x"), 10),
                    y: parseInt(s.attr("y"), 10),
                    width: parseInt(s.attr("width"), 10),
                    height: parseInt(s.attr("height"), 10)
                },
                move = { x: p[0] - d.x, y: p[1] - d.y };
      
                if(move.x < 1 || (move.x*2<d.width)) {
                    d.x = p[0];
                    d.width -= move.x;
                } else {
                    d.width = move.x;       
                }
      
                if(move.y < 1 || (move.y*2<d.height)) {
                    d.y = p[1];
                    d.height -= move.y;
                } else {
                    d.height = move.y;       
                }
                s.attr(d);
      
                // deselect all temporary selected state objects
                d3.selectAll('.cell-selection.cell-selected').classed("cell-selected", false);
                d3.selectAll(".text-selection.text-selected").classed("text-selected",false);

                d3.selectAll('.cell').filter(function(cell_d, i) {
                    if(
                        !d3.select(this).classed("cell-selected") && 
                        // inner circle inside selection frame
                        (this.x.baseVal.value)+cellSize >= d.x && (this.x.baseVal.value)<=d.x+d.width && 
                        (this.y.baseVal.value)+cellSize >= d.y && (this.y.baseVal.value)<=d.y+d.height
                    ) {
                        d3.select(this).classed("cell-selection", true).classed("cell-selected", true);
                        d3.select(".r"+cell_d.row).classed("text-selection",true).classed("text-selected",true);
                        d3.select(".c"+cell_d.col).classed("text-selection",true).classed("text-selected",true);
                    }
                });
            }
        })
        .on("mouseup", function() {
            // remove selection frame
            sa.selectAll("rect.selection").remove();
            // remove temporary selection marker class
            d3.selectAll('.cell-selection').classed("cell-selection", false);
            d3.selectAll(".text-selection").classed("text-selection",false);
        })
        .on("mouseout", function() {
            if(d3.event.relatedTarget.tagName=='html') {
                // remove selection frame
                sa.selectAll("rect.selection").remove();
                // remove temporary selection marker class
                d3.selectAll('.cell-selection').classed("cell-selection", false);
                d3.selectAll(".rowLabel").classed("text-selected",false);
                d3.selectAll(".colLabel").classed("text-selected",false);
            }
        });
});
