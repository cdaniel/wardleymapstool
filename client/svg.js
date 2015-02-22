//-Copyright 2015 Krzysztof Daniel Licensed under the Apache License, Version 2.0 (the 'License'); you may not use this file except in compliance with the License. You may obtain a copy of the License at     http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
(function(d3, _) {
    'use strict';
    var body=d3.select('body');
    var mapid = body.attr('data-mapid');
    d3.json('/api/map/' + mapid, renderChart);

    function pick(key) {
        return function(d) {
            return d[key];
        };
    }

    function unitify(unit) {
        return function(d) {
            return '' + d + unit;
        };
    }

    function renderChart(err, mapo) {
        if (err) {
            console.log(err); // TODO display something
            return;
        }

        // data
        var map = mapo.history[0];
        var nodes = _.groupBy(map.nodes, 'componentId');
        var connections = map.connections.map(function(c) {
            return [ nodes[c.pageSourceId][0], nodes[c.pageTargetId][0] ];
        });

        // basic size
        var margin = {top: 20, right: 20, bottom: 20, left: 20};
        var width = 960 - margin.left - margin.right;
        var height = 500 - margin.top - margin.bottom;

        // scales
        var x = d3.scale.linear().range([0, width]);
        var y = d3.scale.linear().range([0, height]);
        var line = d3.svg.line()
        .x(_.compose(x, pick('positionX')))
        .y(_.compose(y, pick('positionY')));


        // setup viz container
        var mapViz = d3.select('.map')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        // x legend
        var legendItems = ['Genesis', 'Custom built', 'Product(or rental)', 'Commodity/Utility'];
        var xLegend = d3.scale.ordinal()
                        .domain(legendItems)
                        .rangeBands([0, width], 0, 0.1);

        mapViz.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + height + ')')
        .call(function(el) {
            el.append('path')
            .attr('d', line([{positionX:0, positionY:0}, {positionX:1, positionY:0}]));

            el.selectAll('g.label')
            .data(legendItems)
            .enter()
            .append('g')
            .classed('label', true)
            .attr('transform', function(d) { return 'translate(' + xLegend(d) + ',15)'; })
            .append('text')
            .text(_.identity);
        });

        mapViz.append('g')
        .classed('evolution-marker', true)
        .selectAll('path')
        .data(_.tail(legendItems))
        .enter()
        .append('path')
        .attr('transform', function(d) { return 'translate(' + (xLegend(d) - 40) + ',0)'; })
        .attr('d', line([{positionX:0, positionY:1}, {positionX:0, positionY:0}]));

        // y legend
        mapViz.append('g')
        .attr('class', 'y axis')
        .call(function(el) {
            el.append('path')
            .attr('d', line([{positionX:0, positionY:1}, {positionX:0, positionY:0}]));
        });


        // connections
        mapViz
        .selectAll('.connection')
        .data(connections)
        .enter()
        .append('path')
        .classed('connection', true)
        .attr('d', line);

        // nodes
        mapViz
        .append('g')
        .classed('nodes', true)
        .selectAll('node')
        .data(map.nodes)
        .enter()
        .append('g')
        .classed({ node: true, external: pick('external'), userneed: pick('userneed') })
        .call(function(gnode) {
            var moveX = _.compose(x, pick('positionX'));
            var moveY = _.compose(y, pick('positionY'));
            gnode
            .append('circle')
            .attr({ r: '10px', 'cx': moveX, 'cy': moveY });

            gnode.append('text')
            .attr('transform', function(d) { return 'translate(' + (moveX(d) + 12) + ',' + (moveY(d) - 8) + ')';  })
            .text(pick('name'));
        });

        var svg = document.querySelector('svg');
        var svgText = new XMLSerializer().serializeToString(svg);
        d3.select('.svg-text')
        .text(svgText);

    }

})(window.d3, window._)
